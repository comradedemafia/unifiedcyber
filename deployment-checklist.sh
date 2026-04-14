#!/bin/bash

# Deployment Readiness Checklist for All-See-Guard Security System
# This script validates all components are properly configured before deployment

set -e

echo "================================================"
echo "All-See-Guard Deployment Readiness Checker"
echo "================================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to print check result
check_result() {
    local name=$1
    local status=$2
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $name"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $name"
        ((CHECKS_FAILED++))
    fi
}

echo "Checking Frontend Files..."
echo ""

# Check if TypeScript files compile
if npm run build 2>/dev/null; then
    check_result "TypeScript compilation" "PASS"
else
    check_result "TypeScript compilation" "FAIL"
fi

# Check for required hooks
if grep -q "export const useAuditLogging" src/hooks/useAuditLogging.ts 2>/dev/null; then
    check_result "useAuditLogging hook exists" "PASS"
else
    check_result "useAuditLogging hook exists" "FAIL"
fi

if grep -q "export const useSupabaseRealtime" src/hooks/useSupabaseRealtime.ts 2>/dev/null; then
    check_result "useSupabaseRealtime hook exists" "PASS"
else
    check_result "useSupabaseRealtime hook exists" "FAIL"
fi

# Check for required components
if [ -f "src/components/SecurityMonitor.tsx" ]; then
    check_result "SecurityMonitor component exists" "PASS"
else
    check_result "SecurityMonitor component exists" "FAIL"
fi

if [ -f "src/components/IntrusionDetection.tsx" ]; then
    check_result "IntrusionDetection component exists" "PASS"
else
    check_result "IntrusionDetection component exists" "FAIL"
fi

# Check for security utilities
if grep -q "export const validateEmail" src/utils/security.ts 2>/dev/null; then
    check_result "Security validation utilities exist" "PASS"
else
    check_result "Security validation utilities exist" "FAIL"
fi

if grep -q "export const validateAndLog" src/utils/api-validation.ts 2>/dev/null; then
    check_result "API validation utilities exist" "PASS"
else
    check_result "API validation utilities exist" "FAIL"
fi

if [ -f "src/utils/validatedOperations.ts" ]; then
    check_result "Validated operations exist" "PASS"
else
    check_result "Validated operations exist" "FAIL"
fi

echo ""
echo "Checking Database Migrations..."
echo ""

# Check if migration files exist
if [ -f "supabase/migrations/20260404084009_caca9acd-de16-4db6-b527-91d8398bde21.sql" ]; then
    check_result "Base schema migration exists" "PASS"
else
    check_result "Base schema migration exists" "FAIL"
fi

if [ -f "supabase/migrations/20260414_enhanced_security_audit.sql" ]; then
    check_result "Enhanced security migration exists" "PASS"
else
    check_result "Enhanced security migration exists" "FAIL"
fi

echo ""
echo "Checking Supabase Functions..."
echo ""

# Check if required functions exist
if [ -f "supabase/functions/validate-data/index.ts" ]; then
    check_result "validate-data function exists" "PASS"
else
    check_result "validate-data function exists" "FAIL"
fi

if [ -f "supabase/functions/send-critical-alert/index.ts" ]; then
    check_result "send-critical-alert function exists" "PASS"
else
    check_result "send-critical-alert function exists" "FAIL"
fi

echo ""
echo "Checking Environment Configuration..."
echo ""

# Check for required environment files
if [ -f ".env.example" ] || [ -f ".env" ] || [ -f ".env.local" ]; then
    check_result "Environment configuration exists" "PASS"
else
    check_result "Environment configuration exists" "FAIL"
fi

echo ""
echo "Running TypeScript Type Checks..."
echo ""

if npx tsc --noEmit 2>/dev/null; then
    check_result "TypeScript type checking" "PASS"
else
    check_result "TypeScript type checking" "FAIL"
fi

echo ""
echo "Checking ESLint Configuration..."
echo ""

if npm run lint 2>/dev/null; then
    check_result "ESLint validation" "PASS"
else
    check_result "ESLint validation" "FAIL"
fi

echo ""
echo "================================================"
echo "Summary"
echo "================================================"
echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review environment variables in .env"
    echo "2. Run 'supabase migrate' to apply database migrations"
    echo "3. Deploy Supabase functions with 'supabase functions deploy'"
    echo "4. Build the project: npm run build"
    echo "5. Deploy to your hosting platform"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the errors above.${NC}"
    exit 1
fi
