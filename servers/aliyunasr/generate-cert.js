const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 检查是否已存在证书
const keyPath = path.join(__dirname, 'server.key');
const certPath = path.join(__dirname, 'server.crt');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('SSL证书已存在，跳过生成');
  process.exit(0);
}

try {
  console.log('正在生成自签名SSL证书...');
  
  // 生成私钥
  execSync(`openssl genrsa -out ${keyPath} 2048`, { stdio: 'inherit' });
  
  // 生成证书
  execSync(`openssl req -new -x509 -key ${keyPath} -out ${certPath} -days 365 -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });
  
  console.log('SSL证书生成成功！');
  console.log(`私钥: ${keyPath}`);
  console.log(`证书: ${certPath}`);
  
} catch (error) {
  console.error('生成SSL证书失败:', error.message);
  console.log('\n请确保已安装OpenSSL，或者手动创建证书文件。');
  console.log('Windows用户可以从 https://slproweb.com/products/Win32OpenSSL.html 下载OpenSSL');
  process.exit(1);
}
