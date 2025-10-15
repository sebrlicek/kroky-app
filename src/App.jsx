import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function KrokyAplikace() {
  const STORAGE_KEY = "krokyData-admin";
  const [loggedIn, setLoggedIn] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [entries, setEntries] = useState([]);
  const [dateInput, setDateInput] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [stepsInput, setStepsInput] = useState(0);
  const [editingId, setEditingId] = useState(null);

  // načtení dat při přihlášení
  useEffect(() => {
    if (!loggedIn) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setEntries(JSON.parse(raw));
      } catch (e) {
        console.error("Chyba při načítání dat z localStorage", e);
      }
    }
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries, loggedIn]);

  function handleLogin(e) {
    e.preventDefault();
    if (usernameInput === "admin" && passwordInput === "admin") {
      setLoggedIn(true);
      setUsernameInput("");
      setPasswordInput("");
    } else {
      alert("Špatné uživatelské jméno nebo heslo!");
    }
  }

  function handleLogout() {
    setLoggedIn(false);
    setEntries([]);
  }

  function addOrUpdateEntry(e) {
    e.preventDefault();
    const date = dateInput;
    const steps = Number(stepsInput) || 0;
    if (!date) return;

    if (editingId) {
      setEntries((prev) =>
        prev.map((it) => (it.id === editingId ? { ...it, date, steps } : it))
      );
      setEditingId(null);
    } else {
      setEntries((prev) => {
        const other = prev.filter((p) => p.date !== date);
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
    setEntries((prev) => prev.filter((p) => p.id !== id));
  }

  function clearAll() {
    if (!confirm("Opravdu chceš smazat všechny záznamy?")) return;
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  const totalSteps = entries.reduce((s, e) => s + Number(e.steps || 0), 0);
  const avgSteps = entries.length ? Math.round(totalSteps / entries.length) : 0;
  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: e.date, kroky: Number(e.steps) }));

  // --- login obrazovka ---
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-2xl shadow space-y-4 w-80 text-center"
        >
          <h1 className="text-2xl font-bold text-blue-700">Přihlášení</h1>
          <input
            type="text"
            placeholder="Uživatelské jméno"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
          <input
            type="password"
            placeholder="Heslo"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white font-medium"
          >
            Přihlásit se
          </button>
        </form>
      </div>
    );
  }

  // --- hlavní aplikace ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-blue-700">Moje denní kroky</h1>
          <button
            onClick={handleLogout}
            className="px-3 py-1 rounded-xl border border-red-400 text-red-600 text-sm"
          >
            Odhlásit
          </button>
        </header>

        <main className="space-y-6">
          <section className="bg-white rounded-2xl shadow p-4">
            <form onSubmit={addOrUpdateEntry} className="space-y-3">
              <div className="flex gap-2 items-center">
                <label className="w-20 text-sm text-blue-600">Datum</label>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                />
              </div>

              <div className="flex gap-2 items-center">
                <label className="w-20 text-sm text-blue-600">Kroky</label>
                <input
                  type="number"
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                  min={0}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium"
                >
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
                {entries.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium"
                  >
                    Vymazat vše
                  </button>
                )}
              </div>
            </form>

            <div className="mt-4 text-sm text-blue-600">
              <div>
                Počet záznamů:{" "}
                <strong className="text-blue-800">{entries.length}</strong>
              </div>
              <div>
                Celkem kroků:{" "}
                <strong className="text-blue-800">{totalSteps}</strong>
              </div>
              <div>
                Průměr:{" "}
                <strong className="text-blue-800">{avgSteps} kroků/den</strong>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold text-blue-700 mb-2">Graf kroků</h2>
            <div style={{ height: 260 }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="kroky"
                    stroke="#1D4ED8"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
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
                    <th
