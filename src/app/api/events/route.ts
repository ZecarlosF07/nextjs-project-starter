import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        date: 'asc'
      }
    })
    return NextResponse.json(events)
  } catch (error) {
    return NextResponse.json({ error: "Error fetching events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const newEvent = await prisma.event.create({
      data: {
        title: data.title,
        date: new Date(data.date),
        location: data.location,
        status: data.status || "Programado"
      }
    })
    return NextResponse.json(newEvent)
  } catch (error) {
    return NextResponse.json({ error: "Error creating event" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const updatedEvent = await prisma.event.update({
      where: { id: data.id },
      data: {
        title: data.title,
        date: new Date(data.date),
        location: data.location,
        status: data.status
      }
    })
    return NextResponse.json(updatedEvent)
  } catch (error) {
    return NextResponse.json({ error: "Error updating event" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }
    await prisma.event.delete({
      where: { id: parseInt(id) }
    })
    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Error deleting event" }, { status: 500 })
  }
}
