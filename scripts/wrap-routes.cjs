const fs = require("fs")
const path = require("path")

const apiDir = path.join(__dirname, "../app/api")

// Helper to recursively get all route.ts files
function getRouteFiles(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getRouteFiles(filePath))
    } else if (file === "route.ts") {
      results.push(filePath)
    }
  })
  return results
}

const files = getRouteFiles(apiDir)

files.forEach((filePath) => {
  // Exclude next-auth route
  if (filePath.includes("app/api/auth/[...nextauth]")) {
    return
  }

  let content = fs.readFileSync(filePath, "utf8")

  // Check if already wrapped
  if (content.includes("withEncryption")) {
    console.log(`Skipping already wrapped file: ${filePath}`)
    return
  }

  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"]
  const foundMethods = []

  methods.forEach((method) => {
    const regex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`, "g")
    if (regex.test(content)) {
      foundMethods.push(method)
      content = content.replace(regex, `async function _${method}(`)
    }
  })

  if (foundMethods.length > 0) {
    // Add import statement at the top
    content = `import { withEncryption } from "@/lib/api-middleware";\n` + content

    // Append wrapped exports at the bottom
    content += "\n\n// Wrapped exports for encryption/decryption\n"
    foundMethods.forEach((method) => {
      content += `export const ${method} = withEncryption(_${method});\n`
    })

    fs.writeFileSync(filePath, content, "utf8")
    console.log(`Successfully wrapped ${foundMethods.join(", ")} in: ${filePath}`)
  }
})
