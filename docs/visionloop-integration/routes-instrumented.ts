// ============================================================
// VisionLoop routes.ts - INSTRUMENTED WITH LOGIGO
// ============================================================
// Copy this entire file to replace your VisionLoop server/routes.ts
// Make sure you've run: npm install logigo-core
// ============================================================

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { z } from "zod";
import { storage } from "./storage";
import { insertExperimentSchema, insertIterationSchema, type ProcessingStatus } from "@shared/schema";
import { analyzeImageWithGrok, generatePromptFromDescription } from "./services/grok";
import { analyzeImageWithGemini, generatePromptFromDescription as generatePromptWithGemini, generateImageWithGemini, editImageWithNanoBanana } from "./services/gemini";
import { generateImageWithDallE, analyzeImageWithGPT } from "./services/openai";
import { generateImageWithAurora } from "./services/aurora";

// ============================================================
// LOGIGO INTEGRATION - Import and initialize
// ============================================================
import LogiGoOverlay from 'logigo-core';

// Initialize LogiGo overlay (will be available as window.LogiGo)
const logigoOverlay = new LogiGoOverlay({ 
  speed: 1.0,
  debug: true,
  position: 'bottom-right'
});

// Note: For server-side, we create a simple checkpoint function
// The full overlay UI works on the client side
const LogiGo = {
  async checkpoint(nodeId: string, options: any = {}) {
    console.log(`[LogiGo] Checkpoint: ${nodeId}`, options.variables || {});
    // In server context, we log checkpoints
    // The overlay UI integration happens on the client
    return Promise.resolve();
  }
};
// ============================================================

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// Store active processing loops
const activeLoops = new Map<string, { interval?: NodeJS.Timeout; abortController: AbortController }>();

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Serve uploaded images
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  }, express.static(uploadDir));

  // Upload initial image
  app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${req.file.filename}${fileExtension}`;
      const oldPath = req.file.path;
      const newPath = path.join(uploadDir, fileName);

      fs.renameSync(oldPath, newPath);
      
      const imageUrl = `/uploads/${fileName}`;
      
      res.json({ imageUrl, fileName });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Upload failed', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Create new experiment
  app.post('/api/experiments', async (req, res) => {
    try {
      const validatedData = insertExperimentSchema.parse(req.body);
      const experiment = await storage.createExperiment(validatedData);
      res.json(experiment);
    } catch (error) {
      console.error('Create experiment error:', error);
      res.status(400).json({ message: 'Invalid experiment data', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get experiment with iterations
  app.get('/api/experiments/:id', async (req, res) => {
    try {
      const experiment = await storage.getExperimentWithIterations(req.params.id);
      if (!experiment) {
        return res.status(404).json({ message: 'Experiment not found' });
      }
      res.json(experiment);
    } catch (error) {
      console.error('Get experiment error:', error);
      res.status(500).json({ message: 'Failed to get experiment' });
    }
  });

  // Update experiment
  app.patch('/api/experiments/:id', async (req, res) => {
    try {
      const updateSchema = insertExperimentSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const experiment = await storage.updateExperiment(req.params.id, validatedData);
      if (!experiment) {
        return res.status(404).json({ message: 'Experiment not found' });
      }
      res.json(experiment);
    } catch (error) {
      console.error('Update experiment error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid experiment data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update experiment' });
    }
  });

  // Start experiment loop
  app.post('/api/experiments/:id/start', async (req, res) => {
    try {
      const experimentId = req.params.id;
      const experiment = await storage.getExperimentWithIterations(experimentId);
      
      if (!experiment) {
        return res.status(404).json({ message: 'Experiment not found' });
      }

      // Stop any existing loop for this experiment
      if (activeLoops.has(experimentId)) {
        const { interval, abortController } = activeLoops.get(experimentId)!;
        if (interval) clearInterval(interval);
        abortController.abort();
        activeLoops.delete(experimentId);
      }

      // Create iteration 0 for the original image if it doesn't exist
      if (experiment.iterations.length === 0) {
        await storage.createIteration({
          experimentId,
          iterationNumber: 0,
          imageUrl: experiment.originalImageUrl,
          prompt: '',
          visionModel: experiment.visionModel,
          generationModel: experiment.generationModel,
          status: 'completed',
        });
      }

      // Update experiment status
      await storage.updateExperiment(experimentId, { status: 'running' });

      // Start the processing loop
      const abortController = new AbortController();
      activeLoops.set(experimentId, { abortController });
      
      // Start processing immediately
      processNextIteration(experimentId);

      res.json({ message: 'Experiment started', status: 'running' });
    } catch (error) {
      console.error('Start experiment error:', error);
      res.status(500).json({ message: 'Failed to start experiment' });
    }
  });

  // Stop experiment loop
  app.post('/api/experiments/:id/stop', async (req, res) => {
    try {
      const experimentId = req.params.id;
      
      if (activeLoops.has(experimentId)) {
        const { interval, abortController } = activeLoops.get(experimentId)!;
        if (interval) clearInterval(interval);
        abortController.abort();
        activeLoops.delete(experimentId);
      }

      await storage.updateExperiment(experimentId, { status: 'idle' });
      
      res.json({ message: 'Experiment stopped', status: 'idle' });
    } catch (error) {
      console.error('Stop experiment error:', error);
      res.status(500).json({ message: 'Failed to stop experiment' });
    }
  });

  // Pause experiment loop
  app.post('/api/experiments/:id/pause', async (req, res) => {
    try {
      const experimentId = req.params.id;
      
      if (activeLoops.has(experimentId)) {
        const { interval, abortController } = activeLoops.get(experimentId)!;
        if (interval) clearInterval(interval);
        activeLoops.set(experimentId, { abortController });
      }

      await storage.updateExperiment(experimentId, { status: 'paused' });
      
      res.json({ message: 'Experiment paused', status: 'paused' });
    } catch (error) {
      console.error('Pause experiment error:', error);
      res.status(500).json({ message: 'Failed to pause experiment' });
    }
  });

  // Get experiment status
  app.get('/api/experiments/:id/status', async (req, res) => {
    try {
      const experiment = await storage.getExperiment(req.params.id);
      if (!experiment) {
        return res.status(404).json({ message: 'Experiment not found' });
      }

      const status: ProcessingStatus = {
        experimentId: experiment.id,
        status: experiment.status,
        currentIteration: experiment.currentIteration,
        totalIterations: experiment.maxIterations,
      };

      res.json(status);
    } catch (error) {
      console.error('Get status error:', error);
      res.status(500).json({ message: 'Failed to get status' });
    }
  });

  // List all experiments
  app.get('/api/experiments', async (req, res) => {
    try {
      const experiments = await storage.listExperiments();
      res.json(experiments);
    } catch (error) {
      console.error('List experiments error:', error);
      res.status(500).json({ message: 'Failed to list experiments' });
    }
  });

  // Create iteration (for manual prompt editing)
  app.post('/api/experiments/:id/iterations', async (req, res) => {
    try {
      const experimentId = req.params.id;
      const validatedData = insertIterationSchema.parse({
        ...req.body,
        experimentId,
      });
      
      const iteration = await storage.createIteration(validatedData);
      res.json(iteration);
    } catch (error) {
      console.error('Create iteration error:', error);
      res.status(400).json({ message: 'Invalid iteration data' });
    }
  });

  // Update iteration
  app.patch('/api/iterations/:id', async (req, res) => {
    try {
      const iteration = await storage.updateIteration(req.params.id, req.body);
      if (!iteration) {
        return res.status(404).json({ message: 'Iteration not found' });
      }
      res.json(iteration);
    } catch (error) {
      console.error('Update iteration error:', error);
      res.status(500).json({ message: 'Failed to update iteration' });
    }
  });

  // Edit image with Nano Banana
  app.post('/api/iterations/:id/edit', async (req, res) => {
    try {
      const iterationId = req.params.id;
      const { editInstruction } = req.body;

      if (!editInstruction || typeof editInstruction !== 'string') {
        return res.status(400).json({ message: 'Edit instruction is required' });
      }

      const iteration = await storage.getIteration(iterationId);
      if (!iteration) {
        return res.status(404).json({ message: 'Iteration not found' });
      }

      if (!iteration.imageUrl) {
        return res.status(400).json({ message: 'Iteration has no image to edit' });
      }

      const sourceImagePath = path.join(process.cwd(), 'uploads', path.basename(iteration.imageUrl));
      if (!fs.existsSync(sourceImagePath)) {
        return res.status(404).json({ message: 'Source image file not found' });
      }

      const timestamp = Date.now();
      const outputFileName = `edited-${timestamp}.png`;
      const outputPath = path.join(process.cwd(), 'uploads', outputFileName);

      await editImageWithNanoBanana(sourceImagePath, editInstruction, outputPath);

      const editedImageUrl = `/uploads/${outputFileName}`;

      const experiment = await storage.getExperimentWithIterations(iteration.experimentId);
      if (!experiment) {
        return res.status(404).json({ message: 'Experiment not found' });
      }

      const newIteration = await storage.createIteration({
        experimentId: iteration.experimentId,
        iterationNumber: experiment.iterations.length,
        imageUrl: editedImageUrl,
        visionModel: 'gemini',
        generationModel: 'gemini',
        prompt: editInstruction,
        originalPrompt: `Edited from iteration ${iteration.iterationNumber}: ${editInstruction}`,
        status: 'completed',
      });

      res.json({
        iteration: newIteration,
        message: 'Image edited successfully',
      });
    } catch (error) {
      console.error('Image editing error:', error);
      res.status(500).json({ 
        message: 'Failed to edit image', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// ============================================================
// CORE LOOP - INSTRUMENTED WITH LOGIGO CHECKPOINTS
// ============================================================
async function processNextIteration(experimentId: string) {
  try {
    const experiment = await storage.getExperimentWithIterations(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return;
    }

    // ============================================================
    // CHECKPOINT: Iteration Start
    // ============================================================
    await LogiGo.checkpoint('iteration:start', {
      variables: {
        experimentId,
        currentIteration: experiment.currentIteration,
        maxIterations: experiment.maxIterations,
        totalCompleted: experiment.iterations.length
      }
    });

    console.log(`Processing iteration: currentIteration=${experiment.currentIteration}, maxIterations=${experiment.maxIterations}, iterations.length=${experiment.iterations.length}`);

    // Get the image to analyze
    let imageToAnalyze: string;
    let iterationNumber: number;

    // Use the latest iteration's image
    const latestIteration = experiment.iterations[experiment.iterations.length - 1];
    imageToAnalyze = latestIteration.imageUrl;
    iterationNumber = latestIteration.iterationNumber + 1;

    // ============================================================
    // CHECKPOINT: Check Max Iterations
    // ============================================================
    await LogiGo.checkpoint('iteration:check_max', {
      variables: {
        iterationNumber,
        maxIterations: experiment.maxIterations,
        willContinue: iterationNumber <= experiment.maxIterations
      }
    });

    // Check if we've reached max iterations
    if (iterationNumber > experiment.maxIterations) {
      // ============================================================
      // CHECKPOINT: Loop Complete
      // ============================================================
      await LogiGo.checkpoint('loop:complete', {
        variables: {
          totalIterations: iterationNumber - 1,
          status: 'completed'
        }
      });
      
      console.log(`Reached max iterations: iterationNumber=${iterationNumber}, maxIterations=${experiment.maxIterations}`);
      await storage.updateExperiment(experimentId, { status: 'completed' });
      activeLoops.delete(experimentId);
      return;
    }

    // ============================================================
    // CHECKPOINT: Create Iteration Record
    // ============================================================
    await LogiGo.checkpoint('iteration:create_record', {
      variables: {
        iterationNumber,
        visionModel: experiment.visionModel,
        generationModel: experiment.generationModel
      }
    });

    // Create iteration record
    const iteration = await storage.createIteration({
      experimentId,
      iterationNumber,
      imageUrl: '',
      prompt: '',
      visionModel: experiment.visionModel,
      generationModel: experiment.generationModel,
      status: 'processing',
    });

    const startTime = Date.now();

    try {
      // Step 1: Analyze image with vision model
      let description: string;
      let prompt: string;
      
      const previousIteration = experiment.iterations.length > 0 
        ? experiment.iterations[experiment.iterations.length - 1]
        : null;
      
      if (previousIteration && previousIteration.prompt && experiment.manualEditing) {
        // ============================================================
        // CHECKPOINT: Using Manual Prompt
        // ============================================================
        await LogiGo.checkpoint('vision:manual_prompt', {
          variables: {
            source: 'manual_edit',
            promptLength: previousIteration.prompt.length
          }
        });
        
        console.log('Using manually edited prompt from previous iteration');
        description = previousIteration.originalPrompt || previousIteration.prompt;
        prompt = previousIteration.prompt;
      } else {
        // ============================================================
        // CHECKPOINT: Vision Analysis Start
        // ============================================================
        await LogiGo.checkpoint('vision:analyze_start', {
          variables: {
            model: experiment.visionModel,
            imageUrl: imageToAnalyze
          }
        });

        const relativeImagePath = imageToAnalyze.startsWith('/') ? imageToAnalyze.substring(1) : imageToAnalyze;
        const imagePath = path.join(process.cwd(), relativeImagePath);

        if (experiment.visionModel === 'grok') {
          // ============================================================
          // CHECKPOINT: Grok Vision
          // ============================================================
          await LogiGo.checkpoint('vision:grok', {
            variables: { model: 'grok', imagePath }
          });
          
          description = await analyzeImageWithGrok(imagePath);
          prompt = await generatePromptFromDescription(description);
          
        } else if (experiment.visionModel === 'gemini') {
          // ============================================================
          // CHECKPOINT: Gemini Vision
          // ============================================================
          await LogiGo.checkpoint('vision:gemini', {
            variables: { model: 'gemini', imagePath }
          });
          
          description = await analyzeImageWithGemini(imagePath);
          prompt = await generatePromptWithGemini(description);
          
        } else {
          // ============================================================
          // CHECKPOINT: GPT Vision
          // ============================================================
          await LogiGo.checkpoint('vision:gpt', {
            variables: { model: 'gpt', imagePath }
          });
          
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Image = imageBuffer.toString('base64');
          description = await analyzeImageWithGPT(base64Image);
          prompt = description;
        }

        // ============================================================
        // CHECKPOINT: Vision Complete
        // ============================================================
        await LogiGo.checkpoint('vision:complete', {
          variables: {
            descriptionLength: description.length,
            promptLength: prompt.length,
            promptPreview: prompt.substring(0, 100) + '...'
          }
        });
      }

      await storage.updateIteration(iteration.id, {
        originalPrompt: description,
        prompt,
      });

      // ============================================================
      // CHECKPOINT: Image Generation Start
      // ============================================================
      await LogiGo.checkpoint('generate:start', {
        variables: {
          model: experiment.generationModel,
          promptPreview: prompt.substring(0, 100) + '...'
        }
      });

      // Step 2: Generate new image
      let generatedImageUrl: string;
      const fileName = `generated_${iteration.id}.png`;
      const filePath = path.join(uploadDir, fileName);
      
      if (experiment.generationModel === 'dalle') {
        // ============================================================
        // CHECKPOINT: DALL-E Generation
        // ============================================================
        await LogiGo.checkpoint('generate:dalle', {
          variables: { model: 'dalle' }
        });
        
        const result = await generateImageWithDallE(prompt);
        const response = await fetch(result.url);
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));
        generatedImageUrl = `/uploads/${fileName}`;
        
      } else if (experiment.generationModel === 'aurora') {
        // ============================================================
        // CHECKPOINT: Aurora Generation
        // ============================================================
        await LogiGo.checkpoint('generate:aurora', {
          variables: { model: 'aurora' }
        });
        
        const result = await generateImageWithAurora(prompt);
        const response = await fetch(result.url);
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));
        generatedImageUrl = `/uploads/${fileName}`;
        
      } else if (experiment.generationModel === 'gemini' || experiment.generationModel === 'imagen') {
        // ============================================================
        // CHECKPOINT: Gemini/Imagen Generation
        // ============================================================
        await LogiGo.checkpoint('generate:gemini', {
          variables: { model: experiment.generationModel }
        });
        
        await generateImageWithGemini(prompt, filePath);
        generatedImageUrl = `/uploads/${fileName}`;
        
      } else {
        throw new Error(`Unsupported generation model: ${experiment.generationModel}`);
      }

      const processingTime = Date.now() - startTime;

      // ============================================================
      // CHECKPOINT: Generation Complete
      // ============================================================
      await LogiGo.checkpoint('generate:complete', {
        variables: {
          generatedImageUrl,
          processingTimeMs: processingTime
        }
      });

      // Update iteration with results
      await storage.updateIteration(iteration.id, {
        imageUrl: generatedImageUrl,
        status: 'completed',
        processingTimeMs: processingTime,
        tokenCount: prompt.length,
        costEstimate: '$0.08',
      });

      // Update experiment progress
      await storage.updateExperiment(experimentId, {
        currentIteration: iterationNumber,
      });

      // ============================================================
      // CHECKPOINT: Iteration Complete
      // ============================================================
      await LogiGo.checkpoint('iteration:complete', {
        variables: {
          iterationNumber,
          processingTimeMs: processingTime,
          newImageUrl: generatedImageUrl,
          nextAction: experiment.autoProceed ? 'continue' : 'pause'
        }
      });

      // Schedule next iteration if auto-proceed is enabled
      if (experiment.autoProceed && !experiment.manualEditing) {
        // ============================================================
        // CHECKPOINT: Scheduling Next
        // ============================================================
        await LogiGo.checkpoint('loop:schedule_next', {
          variables: {
            delay: experiment.iterationDelay,
            nextIteration: iterationNumber + 1
          }
        });
        
        const loopData = activeLoops.get(experimentId);
        if (loopData) {
          const timeout = setTimeout(() => {
            processNextIteration(experimentId);
          }, experiment.iterationDelay * 1000);
          
          activeLoops.set(experimentId, {
            ...loopData,
            interval: timeout,
          });
        }
      } else {
        // ============================================================
        // CHECKPOINT: Paused for Manual Editing
        // ============================================================
        await LogiGo.checkpoint('loop:paused', {
          variables: {
            reason: 'manual_editing',
            iterationNumber
          }
        });
        
        await storage.updateExperiment(experimentId, { status: 'paused' });
      }

    } catch (error) {
      // ============================================================
      // CHECKPOINT: Error
      // ============================================================
      await LogiGo.checkpoint('iteration:error', {
        variables: {
          error: error instanceof Error ? error.message : 'Unknown error',
          iterationNumber
        }
      });
      
      console.error('Processing iteration error:', error);
      await storage.updateIteration(iteration.id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      await storage.updateExperiment(experimentId, { status: 'error' });
      activeLoops.delete(experimentId);
    }

  } catch (error) {
    // ============================================================
    // CHECKPOINT: Critical Error
    // ============================================================
    await LogiGo.checkpoint('loop:critical_error', {
      variables: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    
    console.error('Process next iteration error:', error);
    await storage.updateExperiment(experimentId, { status: 'error' });
    activeLoops.delete(experimentId);
  }
}
