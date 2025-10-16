import React, { useState, useEffect } from "react";
import emailjs from "emailjs-com";

export default function App() {
  const [users, setUsers] = useState({});
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [verificationLinks, setVerificationLinks] = useState({});

  const STORAGE_USERS_KEY = "krokyAppUsers";
  const STORAGE_VERIFIED_KEY = "verifiedUsers";

  useEffect(() => {
    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    setUsers(usersRaw ? JSON.parse(usersRaw) : {});

    // vytvoření admin účtu
    if (!usersRaw) {
      const admin = { admin: { password: "admin", verified: true, email: "admin@local" } };
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(admin));
      setUsers(admin);
    }
  }, []);

  async function handleRegister(e) {
    e.preventDefault();
    if (!usernameInput || !passwordInput || !emailInput)
      return alert("Vyplň všechna pole!");

    if (users[usernameInput]) return alert("Uživatel již existuje!");

    const newUsers = {
      ...users,
      [usernameInput]: { password: passwordInput, verified: false, email: emailInput },
    };
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(newUsers));
    setUsers(newUsers);

    const verifyLink = `${window.location.origin}?verify=${usernameInput}`;
    setVerificationLinks((prev) => ({ ...prev, [usernameInput]: verifyLink }));

    try {
      await emailjs.send(
        "service_3j2qrmh", // <-- doplň svoje
        "template_o1ojiar", // <-- doplň svoje
        {
          user_name: usernameInput,
          verify_link: verifyLink,
          to_email: emailInput,
        },
        "dCoz5iUpc4pg0B4nz" // <-- doplň svoje
      );
      alert("Ověřovací e-mail byl odeslán! Zkontroluj svou schránku.");
    } catch (error) {
      console.error("Chyba při odesílání e-mailu:", error);
      alert("Nepodařilo se odeslat e-mail. Zkontroluj konfiguraci EmailJS.");
    }

    setUsernameInput("");
    setPasswordInput("");
    setEmailInput("");
    setIsRegistering(false);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyUser = params.get("verify");
    if (verifyUser) {
      const stored = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || "{}");
      if (stored[verifyUser]) {
        stored[verifyUser].verified = true;
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(stored));
        setUsers(stored);
        alert(`Uživatel ${verifyUser} byl ověřen! Můžeš se přihlásit.`);
      }
    }
  }, []);

  function handleLogin(e) {
    e.preventDefault();
    if (!users[usernameInput] || users[usernameInput].password !== passwordInput)
      return alert("Špatné jméno nebo heslo!");

    if (!users[usernameInput].verified)
      return alert("Účet není ověřený. Zkontroluj e-mail!");

    setLoggedInUser(usernameInput);
  }

  function handleLogout() {
    setLoggedInUser(null);
  }

  // UI
  if (!loggedInUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <form
          className="bg-white p-8 rounded-2xl shadow space-y-4 w-96 text-center"
          onSubmit={isRegistering ? handleRegister : handleLogin}
        >
          <h1 className="text-2xl font-bold text-blue-700 mb-2">
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
          {isRegistering && (
            <input
              type="email"
              placeholder="E-mail pro ověření"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          )}

          <button
            type="submit"
            className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white font-medium"
          >
            {isRegistering ? "Registrovat" : "Přihlásit se"}
          </button>

          <p className="text-sm text-blue-700 mt-2">
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

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center text-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">
          Vítej, {loggedInUser}!
        </h1>

        {loggedInUser === "admin" ? (
          <>
            <h2 className="font-semibold mb-2 text-blue-600">Všichni uživatelé</h2>
            <ul className="text-left space-y-2 max-h-60 overflow-y-auto border p-2 rounded">
              {Object.entries(users).map(([user, data]) => (
                <li
                  key={user}
                  className="border-b py-1 flex justify-between items-center"
                >
                  <span>
                    <b>{user}</b> ({data.verified ? "✔️ ověřen" : "❌ neověřen"})
                  </span>
                  <small>{data.email}</small>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-gray-600">
            Úspěšně přihlášen. Tvoje kroky zatím nejsou sledovány. 🙂
          </p>
        )}

        <button
          onClick={handleLogout}
          className="mt-4 px-4 py-2 rounded-xl border border-red-400 text-red-600"
        >
          Odhlásit
        </button>
      </div>
    </div>
  );
}
