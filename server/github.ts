// GitHub Integration for LogiGo - Sync flowcharts to GitHub repository
import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

export interface SyncFlowchartParams {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
}

export async function syncFlowchartToGitHub(params: SyncFlowchartParams): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const octokit = await getUncachableGitHubClient();
    
    // Check if file already exists to get its SHA (needed for updates)
    let existingSha: string | undefined;
    try {
      const existingFile = await octokit.repos.getContent({
        owner: params.owner,
        repo: params.repo,
        path: params.path,
      });
      if ('sha' in existingFile.data) {
        existingSha = existingFile.data.sha;
      }
    } catch (err: any) {
      // File doesn't exist yet, that's fine
      if (err.status !== 404) {
        throw err;
      }
    }

    // Create or update the file
    const response = await octokit.repos.createOrUpdateFileContents({
      owner: params.owner,
      repo: params.repo,
      path: params.path,
      message: params.message,
      content: Buffer.from(params.content).toString('base64'),
      sha: existingSha,
    });

    return {
      success: true,
      url: response.data.content?.html_url || `https://github.com/${params.owner}/${params.repo}/blob/main/${params.path}`,
    };
  } catch (error: any) {
    console.error('[GitHub Sync] Error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to sync to GitHub',
    };
  }
}

export async function listUserRepos(): Promise<{ success: boolean; repos?: Array<{ owner: string; name: string; fullName: string }>; error?: string }> {
  try {
    const octokit = await getUncachableGitHubClient();
    
    const response = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 50,
    });

    const repos = response.data.map(repo => ({
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.full_name,
    }));

    return { success: true, repos };
  } catch (error: any) {
    console.error('[GitHub] Error listing repos:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to list repositories',
    };
  }
}

export async function getGitHubUser(): Promise<{ success: boolean; user?: { login: string; name: string | null; avatar_url: string }; error?: string }> {
  try {
    const octokit = await getUncachableGitHubClient();
    const response = await octokit.users.getAuthenticated();
    
    return {
      success: true,
      user: {
        login: response.data.login,
        name: response.data.name,
        avatar_url: response.data.avatar_url,
      },
    };
  } catch (error: any) {
    console.error('[GitHub] Error getting user:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to get GitHub user',
    };
  }
}
