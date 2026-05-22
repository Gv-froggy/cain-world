@echo off
echo Lancement de Caine...

taskkill /IM "ollama.exe" /F >nul 2>&1
timeout /t 2 >nul

set OLLAMA_ORIGINS=*
start "" ollama serve

timeout /t 3 >nul

code "C:\Users\tallo\Musique\cain-world" --reuse-window

echo Ollama est pret, lance Live Server dans VSCode !
pause