import fs from 'fs'

const version = {
    version: `build-${Date.now()}`,
    buildTime: new Date().toISOString()
}

fs.writeFileSync(
    './public/version.json',
    JSON.stringify(version, null, 2)
)

console.log('✅ version.json generated')
