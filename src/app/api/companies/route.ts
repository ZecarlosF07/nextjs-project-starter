import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Representative, AreaContact } from "@/lib/types"

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      include: {
        representatives: true,
        areaContacts: true,
      }
    })
    return NextResponse.json(companies)
  } catch (error) {
    console.error("Error fetching companies:", error)
    return NextResponse.json({ error: "Error fetching companies" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    // Check if company with same RUC already exists
    const existingCompany = await prisma.company.findUnique({
      where: { ruc: data.ruc },
    })
    if (existingCompany) {
      return NextResponse.json({ error: "Company with this RUC already exists" }, { status: 400 })
    }
    const { representatives, areaContacts, anniversaryDate, ...companyData } = data
    const newCompany = await prisma.company.create({
      data: {
        ...companyData,
        anniversaryDate: anniversaryDate ? new Date(anniversaryDate) : null,
        representatives: {
          create: representatives ? representatives.map((rep: Representative) => ({
            ...rep,
            birthDate: rep.birthDate ? new Date(rep.birthDate) : null
          })) : []
        },
        areaContacts: {
          create: areaContacts || []
        }
      },
      include: {
        representatives: true,
        areaContacts: true
      }
    })
    return NextResponse.json(newCompany)
  } catch (error) {
    console.error("Error creating company:", error)
    return NextResponse.json({ error: "Error creating company" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Check if another company with the same RUC exists
    const existingCompany = await prisma.company.findFirst({
      where: {
        ruc: data.ruc,
        NOT: { id: data.id },
      },
    })
    if (existingCompany) {
      return NextResponse.json({ error: "Another company with this RUC already exists" }, { status: 400 })
    }

    const { id, representatives, areaContacts, anniversaryDate, ...companyData } = data

    // Use transaction to ensure all operations succeed or none do
    const updatedCompany = await prisma.$transaction(async (tx) => {
      // Update main company data
      const company = await tx.company.update({
        where: { id },
        data: {
          ...companyData,
          anniversaryDate: anniversaryDate ? new Date(anniversaryDate) : null,
        },
      })

      // Delete existing representatives and area contacts
      await tx.representative.deleteMany({
        where: { companyId: id }
      })
      await tx.areaContact.deleteMany({
        where: { companyId: id }
      })

      // Create new representatives if any
      if (representatives && representatives.length > 0) {
        await tx.representative.createMany({
          data: representatives.map((rep: Representative) => ({
            ...rep,
            companyId: id,
            birthDate: rep.birthDate ? new Date(rep.birthDate) : null
          }))
        })
      }

      // Create new area contacts if any
      if (areaContacts && areaContacts.length > 0) {
        await tx.areaContact.createMany({
          data: areaContacts.map((contact: AreaContact) => ({
            ...contact,
            companyId: id
          }))
        })
      }

      // Return updated company with all relations
      return tx.company.findUnique({
        where: { id },
        include: {
          representatives: true,
          areaContacts: true
        }
      })
    })

    if (!updatedCompany) {
      throw new Error("Failed to update company")
    }

    return NextResponse.json(updatedCompany)
  } catch (error) {
    console.error("Error updating company:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Error updating company" 
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json()
    if (!data.id || !data.status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 })
    }
    const updatedCompany = await prisma.company.update({
      where: { id: data.id },
      data: { status: data.status },
      include: {
        representatives: true,
        areaContacts: true
      }
    })
    return NextResponse.json(updatedCompany)
  } catch (error) {
    console.error("Error updating company status:", error)
    return NextResponse.json({ error: "Error updating company status" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }
    await prisma.company.delete({
      where: { id: parseInt(id) },
    })
    return NextResponse.json({ message: "Company deleted successfully" })
  } catch (error) {
    console.error("Error deleting company:", error)
    return NextResponse.json({ error: "Error deleting company" }, { status: 500 })
  }
}
