import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function checkCharacters() {
  console.log('🔍 Checking database for characters...')

  try {
    const characters = await prisma.character.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true
      }
    })

    console.log(`✅ Found ${characters.length} characters:`)
    characters.forEach(char => {
      console.log(`  - ${char.name} (${char.slug}): ${char.description.substring(0, 50)}...`)
    })
  } catch (error) {
    console.error('❌ Error checking characters:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCharacters()