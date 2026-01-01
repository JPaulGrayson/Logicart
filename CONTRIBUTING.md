# Contributing to LogiGo

Thank you for your interest in contributing to LogiGo! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ 
- npm or yarn
- Git

### Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/LogiGo.git
   cd LogiGo
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:5000

## 📁 Project Structure

```
LogiGo/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components
│   │   └── contexts/    # React contexts
├── server/          # Express backend
│   ├── routes/      # API route handlers
│   ├── services/    # Business logic
│   └── middleware/  # Express middleware
├── packages/        # Publishable npm packages
│   ├── logigo-core/        # Core checkpoint library
│   ├── logigo-embed/       # React embed component
│   ├── logigo-remote/      # Remote mode
│   └── logigo-vite-plugin/ # Vite plugin
├── docs/            # Documentation
└── test/            # Tests
```

## 🎯 How to Contribute

### Reporting Bugs
1. Check if the bug has already been reported in [Issues](https://github.com/JPaulGrayson/LogiGo/issues)
2. If not, create a new issue using the bug report template
3. Include:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, Node version)

### Suggesting Features
1. Check if the feature has been suggested in [Issues](https://github.com/JPaulGrayson/LogiGo/issues)
2. Create a new issue using the feature request template
3. Describe:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternative solutions considered
   - Why this would benefit LogiGo users

### Submitting Code

#### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

#### 2. Make Your Changes
- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

#### 3. Test Your Changes
```bash
npm run test        # Run all tests
npm run lint        # Check code style
npm run check       # TypeScript type checking
```

#### 4. Commit Your Changes
```bash
git add .
git commit -m "feat: add amazing feature"
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

#### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 📝 Code Standards

### TypeScript
- Use TypeScript for all new code
- Avoid `any` types when possible
- Define interfaces for complex objects
- Use proper type annotations

### React
- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use TypeScript for prop types

### Styling
- Use Tailwind CSS classes
- Follow existing design patterns
- Ensure responsive design
- Test in both light and dark modes

### File Organization
- One component per file
- Co-locate related files
- Use index.ts for barrel exports
- Keep files under 300 lines when possible

## 🧪 Testing

### Running Tests
```bash
npm run test              # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
```

### Writing Tests
- Add tests for new features
- Update tests when modifying existing code
- Aim for high coverage of critical paths
- Use descriptive test names

### Test Structure
```typescript
describe('FeatureName', () => {
  it('should do something specific', () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = doSomething(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for public APIs
- Document complex algorithms
- Explain "why" not just "what"

### User Documentation
- Update `docs/` when adding features
- Include code examples
- Add screenshots for UI changes

## 🔍 Code Review Process

1. **Automated Checks:** CI runs tests and linting
2. **Maintainer Review:** A maintainer reviews your code
3. **Feedback:** Address any requested changes
4. **Approval:** Once approved, your PR will be merged

### What Reviewers Look For
- Code quality and readability
- Test coverage
- Documentation updates
- Breaking changes (if any)
- Performance implications

## 🎨 Design Guidelines

### UI/UX Principles
- Consistency with existing design
- Accessibility (WCAG 2.1 AA)
- Responsive design (mobile-first)
- Clear visual hierarchy
- Intuitive interactions

### Component Design
- Reusable and composable
- Properly typed props
- Accessible (ARIA labels, keyboard navigation)
- Themeable (light/dark mode)

## 🐛 Debugging

### Development Tools
- React DevTools
- Redux DevTools (if using Redux)
- Browser DevTools
- VS Code debugger

### Common Issues
- Check `docs/development/COMMON_PITFALLS.md`
- Search existing issues
- Ask in discussions

## 📞 Getting Help

- **Documentation:** Check `docs/` directory
- **Issues:** Search or create an issue
- **Discussions:** Ask questions in GitHub Discussions
- **Discord:** Join our community (link TBD)

## 🏆 Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Special thanks in major releases

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Your contributions make LogiGo better for everyone. We appreciate your time and effort!

---

**Questions?** Feel free to ask in [GitHub Discussions](https://github.com/JPaulGrayson/LogiGo/discussions)
