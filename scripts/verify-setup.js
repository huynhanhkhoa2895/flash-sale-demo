#!/usr/bin/env node
// Script to verify setup is complete

const { execSync } = require('child_process');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'ignore' });
    log(`✅ ${description}`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description}`, 'red');
    return false;
  }
}

function checkPort(port, service) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      log(`✅ ${service} is running on port ${port}`, 'green');
      resolve(true);
    });
    req.on('error', () => {
      log(`❌ ${service} is NOT running on port ${port}`, 'red');
      resolve(false);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      log(`❌ ${service} timeout on port ${port}`, 'red');
      resolve(false);
    });
  });
}

async function main() {
  log('\n🔍 Verifying Flash Sale Demo Setup...\n', 'blue');

  let allPassed = true;

  // 1. Check Prerequisites
  log('📋 Checking Prerequisites:', 'yellow');
  allPassed &= checkCommand('node --version', 'Node.js installed');
  allPassed &= checkCommand('pnpm --version', 'pnpm installed');
  allPassed &= checkCommand('docker --version', 'Docker installed');
  allPassed &= checkCommand('docker-compose --version', 'Docker Compose installed');
  console.log('');

  // 2. Check Docker Containers
  log('🐳 Checking Docker Containers:', 'yellow');
  try {
    const containers = execSync('docker-compose ps --format json', { encoding: 'utf-8' });
    const containerList = containers.trim().split('\n').filter(Boolean);
    const runningContainers = containerList.filter(c => {
      try {
        const container = JSON.parse(c);
        return container.State === 'running';
      } catch {
        return false;
      }
    });
    
    const expectedContainers = ['zookeeper', 'kafka', 'postgres', 'redis', 'kafka-ui', 'pgadmin'];
    expectedContainers.forEach(containerName => {
      const found = runningContainers.some(c => {
        try {
          const container = JSON.parse(c);
          return container.Name.includes(containerName);
        } catch {
          return false;
        }
      });
      if (found) {
        log(`✅ ${containerName} is running`, 'green');
      } else {
        log(`❌ ${containerName} is NOT running`, 'red');
        allPassed = false;
      }
    });
  } catch (error) {
    log('❌ Cannot check Docker containers. Make sure Docker is running.', 'red');
    allPassed = false;
  }
  console.log('');

  // 3. Check Database
  log('🗄️  Checking Database:', 'yellow');
  allPassed &= checkCommand(
    'docker exec postgres psql -U flashsale -d flash_sale -c "SELECT COUNT(*) FROM products;"',
    'PostgreSQL database accessible'
  );
  console.log('');

  // 4. Check Redis
  log('🔴 Checking Redis:', 'yellow');
  allPassed &= checkCommand(
    'docker exec redis redis-cli -a flashsale123 PING',
    'Redis accessible'
  );
  console.log('');

  // 5. Check Services (if running)
  log('🚀 Checking Services:', 'yellow');
  log('(Skip if services are not started yet)', 'yellow');
  
  const services = [
    { port: 3000, name: 'Web Frontend' },
    { port: 3001, name: 'API Gateway' },
    { port: 3002, name: 'Order Service' },
    { port: 8080, name: 'Kafka UI' },
    { port: 5050, name: 'pgAdmin' },
  ];

  for (const service of services) {
    await checkPort(service.port, service.name);
  }
  console.log('');

  // 6. Check Kafka Topics (if Kafka is running)
  log('📨 Checking Kafka Topics:', 'yellow');
  try {
    const topics = execSync(
      'docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092 2>/dev/null',
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    if (topics.trim()) {
      log(`✅ Kafka topics found: ${topics.trim().split('\n').length} topics`, 'green');
    } else {
      log('⚠️  No Kafka topics found (topics will be created automatically)', 'yellow');
    }
  } catch (error) {
    log('⚠️  Cannot check Kafka topics (Kafka might still be starting)', 'yellow');
  }
  console.log('');

  // Summary
  log('\n📊 Summary:', 'blue');
  if (allPassed) {
    log('✅ Setup looks good! You can start services with: pnpm dev', 'green');
  } else {
    log('❌ Some checks failed. Please review the errors above.', 'red');
    log('\n📖 For detailed setup instructions, see SETUP.md', 'yellow');
  }
  console.log('');
}

main().catch(console.error);

