import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function KrokyAplikace() {
  const STORAGE_KEY = "krokyData-v2";
  const [entries, setEntries] = useState([]);
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().slice(0, 10));
  const [stepsInput, setStepsInput] = useState(0);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setEntries(JSON.parse(raw));
      } catch (e) {
        console.error("Chyba při načítání dat z localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  function addOrUpdateEntry(e) {
    e.preventDefault();
    const date = dateInput;
    const steps = Number(stepsInput) || 0;
    if (!date) return;

    if (editingId) {
      setEntries(prev => prev.map(it => it.id === editingId ? { ...it, date, steps } : it));
      setEditingId(null);
    } else {
      setEntries(prev => {
        const other = prev.filter(p => p.date !== date);
        const newEntry = { id: Date.now().toString(), date, steps };
        return [...other, newEntry].sort((a, b) => a.date.localeCompare(b.date));
      });
    }

    setStepsInput(0);
  }

  function startEdit(entry) {
    setDateInput(entry.date);
    setStepsInput(entry.steps);
    setEditingId(entry.id);
  }

  function removeEntry(id) {
    if (!confirm("Smazat tento záznam?")) return;
    setEntries(prev => prev.filter(p => p.id !== id));
  }

  const totalSteps = entries.reduce((s, e) => s + Number(e.steps || 0), 0);
  const avgSteps = entries.length ? Math.round(totalSteps / entries.length) : 0;

  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => ({ date: e.date, kroky: Number(e.steps) }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-blue-700">Moje denní kroky</h1>
          <div className="text-sm text-blue-600">Ruční zápis kroků</div>
        </header>

        <main className="space-y-6">
          <section className="bg-white rounded-2xl shadow p-4">
            <form onSubmit={addOrUpdateEntry} className="space-y-3">
              <div className="flex gap-2 items-center">
                <label className="w-20 text-sm text-blue-600">Datum</label>
                <input
                  type="date"
                  value={dateInput}
                  onChange={e => setDateInput(e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                />
              </div>

              <div className="flex gap-2 items-center">
                <label className="w-20 text-sm text-blue-600">Kroky</label>
                <input
                  type="number"
                  value={stepsInput}
                  onChange={e => setStepsInput(e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                  min={0}
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium">
                  {editingId ? "Uložit změnu" : "Přidat záznam"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateInput(new Date().toISOString().slice(0, 10));
                    setStepsInput(0);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-blue-200 text-blue-700"
                >
                  Reset
                </button>
              </div>
            </form>

            <div className="mt-4 text-sm text-blue-600">
              <div>Počet záznamů: <strong className="text-blue-800">{entries.length}</strong></div>
              <div>Celkem kroků: <strong className="text-blue-800">{totalSteps}</strong></div>
              <div>Průměr: <strong className="text-blue-800">{avgSteps} kroků/den</strong></div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold text-blue-700 mb-2">Graf kroků</h2>
            <div style={{ height: 260 }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="kroky" stroke="#1D4ED8" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow p-4">
            <h3 className="text-lg font-medium text-blue-700 mb-3">Záznamy</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="text-left text-blue-600">
                    <th className="p-2">Datum</th>
                    <th className="p-2">Kroky</th>
                    <th className="p-2">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {[...entries].sort((a,b) => b.date.localeCompare(a.date)).map(entry => (
                    <tr key={entry.id} className="border-t">
                      <td className="p-2 align-top">{entry.date}</td>
                      <td className="p-2 align-top">{entry.steps.toLocaleString()}</td>
                      <td className="p-2 align-top">
                        <button onClick={() => startEdit(entry)} className="mr-2 text-sm px-3 py-1 rounded-md border border-blue-100">Upravit</button>
                        <button onClick={() => removeEntry(entry.id)} className="text-sm px-3 py-1 rounded-md bg-red-50 text-red-600 border border-red-100">Smazat</button>
                      </td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-gray-500">Zatím žádné záznamy. Zapiš dnešní kroky.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        <footer className="mt-8 text-center text-xs text-gray-500">
          Aplikace pro ruční zápis kroků — jednoduchá a modrá.
        </footer>
      </div>
    </div>
  );
}

