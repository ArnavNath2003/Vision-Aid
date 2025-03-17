# Contributing to VisionAid

First off, thank you for considering contributing to VisionAid! It's people like you that make VisionAid such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Be respectful and inclusive
- Exercise consideration and empathy in your speech and actions
- Focus on what is best for the community

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Describe the behavior you observed and what you expected to see
- Include screenshots if possible
- Include your environment details (OS, browser, etc.)

### Suggesting Enhancements

If you have a suggestion for a new feature:

1. Check if it's already been suggested
2. Provide a clear description of the enhancement
3. Explain why this enhancement would be useful
4. Suggest an implementation approach if possible

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing style
5. Write a good commit message

## Development Setup

1. Fork and clone the repo
2. Run `npm install` to install dependencies
3. Create a `.env` file following the `.env.example` template
4. Run `npm run dev` to start the development server

### Coding Style

- Use TypeScript
- Follow the existing code style
- Use meaningful variable and function names
- Comment complex logic
- Keep functions small and focused

### Commit Messages

Format: `type(scope): description`

Types:

- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

Example: `feat(chatbot): add AI response handling`

## Project Structure

```text
vision-aid/
├── src/
│   ├── components/   # React components
│   ├── services/     # API and utility services
│   ├── assets/       # Static assets
│   └── App.tsx       # Main application component
├── public/           # Public assets
└── package.json      # Project dependencies
```

## Getting Help

- Create an issue with a detailed description
- Reach out to maintainers:
  - [@shichancoder](https://github.com/shichancoder)
  - [@saksham-jain177](https://github.com/saksham-jain177)

## Recognition

Contributors will be added to the README.md file and acknowledged in release notes.

Thank you for contributing to VisionAid! 🚀
