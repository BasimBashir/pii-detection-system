/**
 * Test Suite for PII Detection Service
 * Tests various obfuscation techniques and edge cases
 */

require('dotenv').config();
const PIIDetectionService = require('./pii-detection-service');

// Load API keys from environment
function loadAPIKeys() {
  const keys = [];
  let keyIndex = 1;
  
  while (true) {
    const key = process.env[`GEMINI_API_KEY_${keyIndex}`];
    
    if (!key) {
      break;
    }
    
    // Skip placeholder keys
    if (key.includes('your-api-key') || key.includes('your-key') || key.trim().length < 20) {
      console.warn(`[Warning] GEMINI_API_KEY_${keyIndex} is a placeholder. Skipping.`);
      keyIndex++;
      continue;
    }
    
    keys.push(key);
    keyIndex++;
  }
  
  return keys;
}

const testKeys = loadAPIKeys();

if (testKeys.length === 0) {
  console.error('\n===========================================');
  console.error('❌ ERROR: No valid API keys found!');
  console.error('===========================================');
  console.error('\nCannot run tests without valid API keys.');
  console.error('\nPlease:');
  console.error('1. Get API keys from: https://aistudio.google.com/app/apikey');
  console.error('2. Add to .env file as GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.');
  console.error('3. See SETUP_GUIDE.md for detailed instructions');
  console.error('\n===========================================\n');
  process.exit(1);
}

console.log(`\n[Test Setup] Found ${testKeys.length} valid API key(s)\n`);

// Initialize service
let piiService;

try {
  piiService = new PIIDetectionService(testKeys, {
    model: 'gemini-2.5-flash',
    enableLogging: true
  });
} catch (error) {
  console.error('\n===========================================');
  console.error('❌ Failed to initialize PII Detection Service');
  console.error('===========================================');
  console.error(`Error: ${error.message}`);
  console.error('\n===========================================\n');
  process.exit(1);
}

// Test cases covering various PII obfuscation techniques
const testCases = [
  {
    name: 'Standard Phone Number',
    text: 'Call me at 555-123-4567',
    shouldDetect: true
  },
  {
    name: 'Phone with Spaces',
    text: 'My number is 5 5 5 - 1 2 3 - 4 5 6 7',
    shouldDetect: true
  },
  {
    name: 'Phone Spelled Out',
    text: 'Contact me at five five five one two three four five six seven',
    shouldDetect: true
  },
  {
    name: 'Leetspeak Phone',
    text: 'ph0ne: 5five5-1234',
    shouldDetect: true
  },
  {
    name: 'Phone with Dots',
    text: 'Text me at 555.123.4567',
    shouldDetect: true
  },
  {
    name: 'International Phone',
    text: 'WhatsApp: +1 (555) 123-4567',
    shouldDetect: true
  },
  {
    name: 'Standard Email',
    text: 'Email me at john.doe@example.com',
    shouldDetect: true
  },
  {
    name: 'Email with [at] [dot]',
    text: 'Contact: john[at]example[dot]com',
    shouldDetect: true
  },
  {
    name: 'Email Spelled Out',
    text: 'my email is john at example dot com',
    shouldDetect: true
  },
  {
    name: 'Leetspeak Email',
    text: 'Em4il: j0hn@3x4mpl3.c0m',
    shouldDetect: true
  },
  {
    name: 'Social Media Handle',
    text: 'Find me on Instagram @johndoe123',
    shouldDetect: true
  },
  {
    name: 'WhatsApp Number',
    text: 'Add me on WhatsApp 5551234567',
    shouldDetect: true
  },
  {
    name: 'Telegram Username',
    text: 'Message me on Telegram: @john_doe',
    shouldDetect: true
  },
  {
    name: 'Discord ID',
    text: 'Discord: johndoe#1234',
    shouldDetect: true
  },
  {
    name: 'Multiple Contact Methods',
    text: 'Call 555-1234 or email john@email.com',
    shouldDetect: true
  },
  {
    name: 'Creative Obfuscation',
    text: 'My contact is five-five-five twelve thirty-four',
    shouldDetect: true
  },
  {
    name: 'DM Me Hint',
    text: 'DM me for details, my handle is john123',
    shouldDetect: true
  },
  {
    name: 'Character Insertion',
    text: 'c-a-l-l m-e a-t 5-5-5-1-2-3-4',
    shouldDetect: true
  },
  {
    name: 'Safe Message 1',
    text: 'Great! When should we meet at the location?',
    shouldDetect: false
  },
  {
    name: 'Safe Message 2',
    text: 'Can you help me with the plumbing issue tomorrow?',
    shouldDetect: false
  },
  {
    name: 'Safe Message 3',
    text: 'The job will cost around $500',
    shouldDetect: false
  },
  {
    name: 'Phone in Address',
    text: 'I live at 555 Main Street',
    shouldDetect: false // Street address, not phone
  },
  {
    name: 'Subtle Hint',
    text: 'Text me your number so we can discuss offline',
    shouldDetect: true // Attempting to exchange contact
  },
  {
    name: 'Hidden Contact Request',
    text: 'Share your contact details privately',
    shouldDetect: true
  }
];

// Run tests
async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 PII DETECTION TEST SUITE');
  console.log('='.repeat(60));
  console.log(`Using ${testKeys.length} API key(s) for testing`);
  console.log('='.repeat(60));
  console.log();

  let passed = 0;
  let failed = 0;
  let errors = 0;
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    
    console.log(`\n📝 Test ${i + 1}/${testCases.length}: ${test.name}`);
    console.log(`   Input: "${test.text}"`);
    console.log(`   Expected: ${test.shouldDetect ? 'DETECT PII' : 'NO PII'}`);

    try {
      const detection = await piiService.detectPIIInText(
        test.text,
        'test-user-' + i
      );

      const testPassed = detection.hasPII === test.shouldDetect;
      
      if (testPassed) {
        console.log(`   ✅ PASSED`);
        passed++;
      } else {
        console.log(`   ❌ FAILED`);
        console.log(`   Got: ${detection.hasPII ? 'DETECTED' : 'NOT DETECTED'}`);
        failed++;
      }

      if (detection.hasPII) {
        console.log(`   📊 Confidence: ${detection.confidence}%`);
        console.log(`   ⚠️  Risk Level: ${detection.riskLevel}`);
        console.log(`   🔍 Items: ${detection.detectedItems.length}`);
        detection.detectedItems.forEach((item, idx) => {
          console.log(`      ${idx + 1}. ${item.type}: ${item.value || item.description}`);
        });
      }

      results.push({
        test: test.name,
        passed: testPassed,
        detection
      });

      // Delay to respect rate limits
      await sleep(2000); // Increased delay for safety

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      errors++;
      results.push({
        test: test.name,
        passed: false,
        error: error.message
      });
      
      // If it's an API key error, stop testing
      if (error.message.includes('API key')) {
        console.log('\n   ⚠️  Stopping tests due to API key error');
        console.log('   Please check your API keys and try again');
        break;
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests Run: ${passed + failed + errors}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Errors: ${errors}`);
  if (passed + failed > 0) {
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
  }
  console.log('='.repeat(60));

  // Print API usage stats
  console.log('\n📈 API USAGE STATISTICS');
  console.log('='.repeat(60));
  const stats = piiService.getUsageStats();
  stats.forEach(stat => {
    console.log(`${stat.keyName}:`);
    console.log(`  Preview: ${stat.keyPreview}`);
    console.log(`  Current: ${stat.isCurrent ? '✅ Active' : '⏸️  Standby'}`);
    console.log(`  Requests: ${stat.requests}`);
    console.log(`  Errors: ${stat.errors}`);
    console.log(`  Rate Limit Hits: ${stat.rateLimitHits}`);
    console.log(`  Last Used: ${stat.lastUsed || 'Never'}`);
    console.log();
  });

  return results;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run if executed directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('✨ Tests completed!\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error.message);
      console.error('\nPlease check:');
      console.error('1. Your API keys are valid');
      console.error('2. You have internet connection');
      console.error('3. Gemini API is accessible');
      console.error('\nSee SETUP_GUIDE.md for help\n');
      process.exit(1);
    });
}

module.exports = { runTests, testCases };