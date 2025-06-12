import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const certificates = await prisma.certificate.findMany({
      include: {
        company: true
      },
      orderBy: {
        issueDate: 'desc'
      }
    })
    return NextResponse.json(certificates)
  } catch (error) {
    return NextResponse.json({ error: "Error fetching certificates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const newCertificate = await prisma.certificate.create({
      data: {
        title: data.title,
        companyId: data.companyId,
        status: data.status || "Emitido"
      },
      include: {
        company: true
      }
    })
    return NextResponse.json(newCertificate)
  } catch (error) {
    return NextResponse.json({ error: "Error creating certificate" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const updatedCertificate = await prisma.certificate.update({
      where: { id: data.id },
      data: {
        title: data.title,
        status: data.status
      },
      include: {
        company: true
      }
    })
    return NextResponse.json(updatedCertificate)
  } catch (error) {
    return NextResponse.json({ error: "Error updating certificate" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }
    await prisma.certificate.delete({
      where: { id: parseInt(id) }
    })
    return NextResponse.json({ message: "Certificate deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Error deleting certificate" }, { status: 500 })
  }
}
