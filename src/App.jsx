import React, { useState, useEffect } from "react";

export default function App() {
  const STORAGE_USERS_KEY = "krokyAppUsers";
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [entries, setEntries] = useState([]);
  const [stepsInput, setStepsInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mathAnswer, setMathAnswer] = useState("");
  const [mathVerified, setMathVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [editPasswords, setEditPasswords] = useState({});

  const today = new Date().toISOString().slice(0, 10);

  // vytvoření admin účtu
  useEffect(() => {
    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    if (!users["admin"]) {
      users["admin"] = "admin";
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    }
  }, []);

  // načtení záznamů po přihlášení
  useEffect(() => {
    if (!loggedInUser) return;
    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : {};

    if (loggedInUser === "admin") {
      let allEntries = [];
      Object.keys(users).forEach((u) => {
        const raw = localStorage.getItem(`krokyData-${u}`);
        if (raw) {
          const data = JSON.parse(raw);
          data.forEach((e) => (e.user = u));
          allEntries = allEntries.concat(data);
        }
      });
      setEntries(allEntries);
    } else {
      const raw = localStorage.getItem(`krokyData-${loggedInUser}`);
      if (raw) setEntries(JSON.parse(raw));
    }
  }, [loggedInUser]);

  // ukládání dat
  useEffect(() => {
    if (!loggedInUser || loggedInUser === "admin") return;
    localStorage.setItem(`krokyData-${loggedInUser}`, JSON.stringify(entries));
  }, [entries, loggedInUser]);

  // registrace
  function handleRegister(e) {
    e.preventDefault();
    if (!usernameInput || !passwordInput) return alert("Vyplň jméno i heslo");

    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : {};

    if (users[usernameInput]) return alert("Uživatel už existuje");

    users[usernameInput] = passwordInput;
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));

    alert("Registrace úspěšná! Přihlaš se.");
    setIsRegistering(false);
    setUsernameInput("");
    setPasswordInput("");
  }

  // přihlášení
  function handleLogin(e) {
    e.preventDefault();
    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    if (!users[usernameInput] || users[usernameInput] !== passwordInput)
      return alert("Špatné jméno nebo heslo!");
    setLoggedInUser(usernameInput);
    setUsernameInput("");
    setPasswordInput("");
  }

  function handleLogout() {
    setLoggedInUser(null);
    setEntries([]);
    setShowSettings(false);
    setMathVerified(false);
    setMathAnswer("");
    setNewPassword("");
  }

  // přidání kroků
  function addOrUpdateEntry(e) {
    e.preventDefault();
    const steps = Number(stepsInput) || 0;
    const date = today;

    if (editingId) {
      setEntries((prev) =>
        prev.map((it) => (it.id === editingId ? { ...it, steps } : it))
      );
      setEditingId(null);
    } else {
      setEntries((prev) => {
        const filtered = prev.filter((p) => p.date !== date);
        const newEntry = { id: Date.now().toString(), date, steps, user: loggedInUser };
        return [...filtered, newEntry].sort((a, b) => a.date.localeCompare(b.date));
      });
    }
    setStepsInput("");
  }

  function removeEntry(id) {
    if (!confirm("Smazat záznam?")) return;
    setEntries((prev) => prev.filter((p) => p.id !== id));
  }

  function clearAll() {
    if (!confirm("Smazat všechny záznamy?")) return;
    setEntries([]);
    localStorage.removeItem(`krokyData-${loggedInUser}`);
  }

  // změna hesla (uživatel)
  function verifyMath(e) {
    e.preventDefault();
    if (Number(mathAnswer) === 23 * 10) setMathVerified(true);
    else alert("Špatně! Zkus znovu.");
  }

  function changePassword(e) {
    e.preventDefault();
    if (!newPassword) return alert("Zadej nové heslo");
    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    users[loggedInUser] = newPassword;
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    alert("Heslo změněno!");
    setShowSettings(false);
    setMathVerified(false);
    setMathAnswer("");
    setNewPassword("");
  }

  // admin - mazání a změna hesla uživatelům
  function deleteUser(user) {
    if (!confirm(`Smazat uživatele "${user}" a jeho data?`)) return;
    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    delete users[user];
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    localStorage.removeItem(`krokyData-${user}`);
    setEntries((prev) => prev.filter((e) => e.user !== user));
  }

  function changeUserPassword(user) {
    const newPass = editPasswords[user];
    if (!newPass) return alert("Zadej nové heslo");
    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    users[user] = newPass;
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    alert(`Heslo pro uživatele "${user}" bylo změněno!`);
    setEditPasswords((prev) => ({ ...prev, [user]: "" }));
  }

  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: e.date, kroky: Number(e.steps), user: e.user }));

  // přihlašovací stránka
  if (!loggedInUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <form
          onSubmit={isRegistering ? handleRegister : handleLogin}
          className="bg-white p-8 rounded-2xl shadow space-y-4 w-80 text-center"
        >
          <h1 className="text-2xl font-bold text-blue-700">
            {isRegistering ? "Registrace" : "Přihlášení"}
          </h1>
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
            className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white"
          >
            {isRegistering ? "Registrovat" : "Přihlásit se"}
          </button>
          <p className="text-sm text-blue-700">
            {isRegistering ? "Máš účet?" : "Nemáš účet?"}{" "}
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="underline"
            >
              {isRegistering ? "Přihlásit se" : "Registrovat"}
            </button>
          </p>
        </form>
      </div>
    );
  }

  // hlavní stránka
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-blue-700">
            {loggedInUser === "admin" ? "Admin panel" : "Moje kroky"}
          </h1>
          <button
            onClick={handleLogout}
            className="px-3 py-1 border border-red-400 text-red-600 rounded-xl"
          >
            Odhlásit
          </button>
        </header>

        {/* Uživatel */}
        {loggedInUser !== "admin" && (
          <>
            <form onSubmit={addOrUpdateEntry} className="bg-white p-4 rounded-2xl shadow mb-6">
              <h2 className="text-blue-600 font-semibold mb-2">Dnešní záznam</h2>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  placeholder="Počet kroků"
                  className="flex-1 p-2 border rounded-md"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-xl">
                  Přidat
                </button>
                {entries.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl"
                  >
                    Smazat vše
                  </button>
                )}
              </div>
            </form>

            {/* Nastavení účtu */}
            <div className="mb-6">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-xl"
              >
                Nastavení účtu
              </button>

              {showSettings && (
                <div className="mt-3 bg-white p-4 rounded-2xl shadow">
                  {!mathVerified ? (
                    <form onSubmit={verifyMath}>
                      <p>Zadej výsledek: 23 × 10</p>
                      <input
                        type="number"
                        value={mathAnswer}
                        onChange={(e) => setMathAnswer(e.target.value)}
                        className="p-2 border rounded-md w-full"
                      />
                      <button className="bg-blue-600 text-white px-4 py-2 mt-2 rounded-xl">
                        Ověřit
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={changePassword}>
                      <p>Zadej nové heslo:</p>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="p-2 border rounded-md w-full"
                      />
                      <button className="bg-green-600 text-white px-4 py-2 mt-2 rounded-xl">
                        Změnit heslo
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Admin panel */}
        {loggedInUser === "admin" && (
          <div className="bg-white p-4 rounded-2xl shadow">
            <h2 className="text-blue-600 font-semibold mb-3">Admin – všichni uživatelé</h2>
            <table className="w-full border mb-6 text-sm">
              <thead>
                <tr className="bg-blue-100">
                  <th className="border p-2">Uživatel</th>
                  <th className="border p-2">Heslo</th>
                  <th className="border p-2">Změnit heslo</th>
                  <th className="border p-2">Akce</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
                  const users = usersRaw ? JSON.parse(usersRaw) : {};
                  return Object.keys(users).map((u) => (
                    <tr key={u}>
                      <td className="border p-2">{u}</td>
                      <td className="border p-2">{users[u]}</td>
                      <td className="border p-2">
                        {u !== "admin" && (
                          <div className="flex gap-2">
                            <input
                              type="password"
                              placeholder="Nové heslo"
                              value={editPasswords[u] || ""}
                              onChange={(e) =>
                                setEditPasswords((prev) => ({
                                  ...prev,
                                  [u]: e.target.value,
                                }))
                              }
                              className="border p-1 rounded-md flex-1"
                            />
                            <button
                              onClick={() => changeUserPassword(u)}
                              className="bg-green-600 text-white px-3 py-1 rounded-xl"
                            >
                              Uložit
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="border p-2 text-center">
                        {u !== "admin" && (
                          <button
                            onClick={() => deleteUser(u)}
                            className="bg-red-500 text-white px-3 py-1 rounded-xl"
                          >
                            Smazat
                          </button>
                        )}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>

            <h3 className="text-blue-600 font-semibold mb-2">Všechny záznamy kroků</h3>
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-blue-100">
                  <th className="border p-2">Uživatel</th>
                  <th className="border p-2">Datum</th>
                  <th className="border p-2">Kroky</th>
                </tr>
              </thead>
              <tbody>
                {[...entries]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((e) => (
                    <tr key={e.id}>
                      <td className="border p-2">{e.user}</td>
                      <td className="border p-2">{e.date}</td>
                      <td className="border p-2">{e.steps}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
