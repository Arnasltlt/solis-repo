#!/bin/bash
# This script contains cron jobs for the Solis application
# It should be scheduled to run daily

# Set environment variables if not already set in the cron environment
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Log file
LOG_DIR="logs"
mkdir -p $LOG_DIR
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="$LOG_DIR/cron-$TIMESTAMP.log"

echo "Starting cron jobs at $(date)" | tee -a $LOG_FILE

# Process recurring payments
echo "Processing recurring payments..." | tee -a $LOG_FILE
ts-node scripts/process-recurring-payments.ts 2>&1 | tee -a $LOG_FILE

echo "Cron jobs completed at $(date)" | tee -a $LOG_FILE 