@echo off
:: Dummy job script that simulates a C++ application
:: It randomly succeeds or fails with configurable probability

echo [%time%] Starting job with arguments: %*
echo Job name: %1
echo Additional arguments: %2 %3 %4 %5 %6 %7 %8 %9

:: Simulate processing time (random between 1-5 seconds)
set /a sleep_time=%RANDOM% %% 5 + 1
echo Processing for %sleep_time% seconds...
timeout /t %sleep_time% /nobreak > nul

:: Randomly decide if the job will succeed or fail (30% chance of failure)
set /a random_num=%RANDOM% %% 10
if %random_num% lss 3 (
    echo [%time%] Job failed with an error!
    exit /b 1
) else (
    echo [%time%] Job completed successfully!
    exit /b 0
)
