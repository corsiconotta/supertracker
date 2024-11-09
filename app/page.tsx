'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Pencil, Trash2 } from 'lucide-react'

const VIAL_SIZE = 10 // ml
const SHOT_SIZE = 0.11 // ml

type ShotEntry = {
  id?: string;
  date: string;
  brand: string;
  type: string;
  amountMl: string;
  amountMg: string;
  location: string;
}

export default function InsulinTracker() {
  const [remainingInsulin, setRemainingInsulin] = useState(VIAL_SIZE)
  const [shotsTaken, setShotsTaken] = useState(0)
  const [shotEntries, setShotEntries] = useState<ShotEntry[]>([])
  const [newShot, setNewShot] = useState<ShotEntry>({
    date: '',
    brand: '',
    type: '',
    amountMl: '',
    amountMg: '',
    location: ''
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const q = query(collection(db, 'insulin_entries'), orderBy('date', 'desc'))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const entries: ShotEntry[] = []
      querySnapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data() } as ShotEntry)
      })
      setShotEntries(entries)
      updateRemainingInsulin(entries)
    })

    return () => unsubscribe()
  }, [])

  const updateRemainingInsulin = (entries: ShotEntry[]) => {
    const totalUsed = entries.reduce((total, entry) => total + parseFloat(entry.amountMl), 0)
    setRemainingInsulin(Math.max(VIAL_SIZE - totalUsed, 0))
    setShotsTaken(entries.length)
  }

  const registerShot = async () => {
    if (remainingInsulin >= SHOT_SIZE) {
      try {
        if (editingId) {
          await updateDoc(doc(db, 'insulin_entries', editingId), newShot)
          setEditingId(null)
          toast({
            title: "Success",
            description: "Shot updated in Firestore",
          })
        } else {
          await addDoc(collection(db, 'insulin_entries'), newShot)
          toast({
            title: "Success",
            description: "Shot registered and saved to Firestore",
          })
        }
        setNewShot({
          date: '',
          brand: '',
          type: '',
          amountMl: '',
          amountMg: '',
          location: ''
        })
      } catch (error) {
        console.error('Error saving entry:', error);
        toast({
          title: "Error",
          description: "Failed to save entry to Firestore",
          variant: "destructive",
        })
      }
    }
  }

  const editShot = (entry: ShotEntry) => {
    setNewShot(entry)
    setEditingId(entry.id!)
  }

  const deleteShot = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'insulin_entries', id))
      toast({
        title: "Success",
        description: "Shot deleted from Firestore",
      })
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete entry from Firestore",
        variant: "destructive",
      })
    }
  }

  const resetVial = () => {
    setRemainingInsulin(VIAL_SIZE)
    setShotsTaken(0)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewShot(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const remainingShots = Math.floor(remainingInsulin / SHOT_SIZE)
  const daysRemaining = remainingShots

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Insulin Tracker</CardTitle>
        <CardDescription>Track your insulin supply and usage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input type="date" id="date" name="date" value={newShot.date} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input type="text" id="brand" name="brand" value={newShot.brand} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Input type="text" id="type" name="type" value={newShot.type} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="amountMl">Amount (ml)</Label>
            <Input type="number" id="amountMl" name="amountMl" value={newShot.amountMl} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="amountMg">Amount (mg)</Label>
            <Input type="number" id="amountMg" name="amountMg" value={newShot.amountMg} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input type="text" id="location" name="location" value={newShot.location} onChange={handleInputChange} />
          </div>
        </div>
        <Button onClick={registerShot} className="w-full mt-4">{editingId ? 'Update' : 'Register'} Shot</Button>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>Remaining Insulin: {remainingInsulin.toFixed(2)} ml</div>
          <div>Shots Taken: {shotsTaken}</div>
          <div>Estimated Shots Remaining: {remainingShots}</div>
          <div>Estimated Days Remaining: {daysRemaining}</div>
        </div>
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount (ml)</TableHead>
                <TableHead>Amount (mg)</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shotEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.brand}</TableCell>
                  <TableCell>{entry.type}</TableCell>
                  <TableCell>{entry.amountMl}</TableCell>
                  <TableCell>{entry.amountMg}</TableCell>
                  <TableCell>{entry.location}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => editShot(entry)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteShot(entry.id!)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={resetVial} className="w-full">Reset Vial</Button>
      </CardFooter>
    </Card>
  )
}