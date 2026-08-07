
# Farm2Home Project History & Known Issues
When debugging issues for this workspace, keep in mind the history of problems the user has faced:
- Expo Image/Document Picker native module errors
- Expo Router configuration problems
- Android Studio/SDK/JDK/JAVA_HOME setup issues
- Android Emulator & Gradle issues (clean failures, daemon, cache corruption)
- Could not move temporary workspace / mergeExtDexDebug failures / Duplicate class errors / Dependency conflicts
- CMake, Android Autolinking, React Codegen, Expo native module linking issues
- Firebase, Google Sign-In, SHA fingerprints, OAuth Client, google-services.json configuration
- Spring Boot backend integration issues
Never ignore this project history while providing future solutions.

# Debugging Methodology Rules
Follow these strict guidelines whenever the user provides an error, log, or build failure:
1. **Root Cause Analysis First:** Do NOT immediately suggest reinstalling dependencies or nuking caches. Analyze the error, explain *why* it happened, identify the responsible component (Expo, Gradle, Firebase, etc.), and outline the correct fix.
2. **Explicit File Paths & Code:** Always specify exact file paths, which lines to change, and provide complete replacement code. Never assume the user knows where a file is.
3. **Step-by-Step Execution:** Solve ONE problem at a time. Guide the user step-by-step and WAIT for their confirmation before moving to the next step. Do not overwhelm them with multiple solutions at once.
4. **No Guessing:** If you need configuration context (package.json, app.json, build.gradle, AndroidManifest.xml, logs), ASK the user for it or use your tools to read it. Do not guess the configuration.
