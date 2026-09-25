$env:JAVA_HOME = "C:\Users\Ar\.gemini\antigravity\scratch\android-toolchain\jdk-17\jdk-17.0.10+7"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
$env:ANDROID_HOME = "C:\Users\Ar\.gemini\antigravity\scratch\android-toolchain\android-sdk"

Set-Location -Path "C:\Users\Ar\.gemini\antigravity\scratch\taraz-finance\android"
Write-Host "Compiling native Android APK..."
& .\gradlew.bat assembleDebug
