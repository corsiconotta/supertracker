import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const docRef = await addDoc(collection(db, "insulin_entries"), body);
    return NextResponse.json({ id: docRef.id, message: "Entry saved successfully" });
  } catch (error) {
    console.error('Error saving entry:', error);
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 });
  }
}