# Contributing to StreamVault Downloader 📥

Thank you for your interest in contributing to **StreamVault**! Community contributions help make this project more versatile, stable, and fast.

---

## 📌 Ways to Contribute

- **Report Bugs**: If you encounter issues with video parsing, extraction, or specific platform updates, open an Issue with the exact error log and OS version.
- **Feature Requests**: Suggest new features (e.g., subtitle downloader, proxy support, scheduling, browser extensions).
- **Code Contributions**: Implement UI improvements, performance fixes, or new format converters.
- **Documentation**: Help improve setup instructions, cross-platform build notes, or FAQs.

---

## 🚀 Development Setup

1. **Fork the Repository** on GitHub.
2. **Clone your fork locally**:
   ```bash
   git clone https://github.com/dhruvil-114/streamvault-downloader.git
   cd streamvault-downloader
   ```
3. **Run Automated Windows Setup**:
   ```cmd
   setup.bat
   ```
   *Or install manually:*
   ```bash
   npm install
   # Ensure yt-dlp and ffmpeg are placed in the bin/ folder or available in PATH
   npm run build
   ```
4. **Start in Development Mode** (Hot Reloading):
   ```cmd
   run.bat --dev
   # or
   npm run electron:dev
   ```

---

## 📋 Guidelines

- Maintain the modern, clean light-mode UI styling and high-contrast accessibility.
- Adhere to the security hardening rules:
  - Do not disable Chromium sandbox or context isolation.
  - Sanitize all external URLs before passing to CLI processes.
  - Whitelist allowed media formats for shell open commands.
- Never commit precompiled binary executables (`.exe`, `.dll`) or downloaded media files.

---

## 📄 License

Contributions are submitted under the project's [MIT License](LICENSE).
