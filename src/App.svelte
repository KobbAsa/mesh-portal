<script>
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';

  import Sidebar from './components/Sidebar.svelte';
  import Chat from './components/Chat.svelte';
  import FileShare from './components/FileShare.svelte';
  import AuthScreen from './components/AuthScreen.svelte';

  const serverIP = window.location.hostname;

  let isLoggedIn = false;
  let loginError = "";
  let myIP = "З'єднання...";
  let myName = "";

  let isConnected = false;
  let onlineUsers = [];
  let messages = [];
  let files = [];
  let socket;

  onMount(() => {
    const savedToken = localStorage.getItem('mesh_token');
    const savedName = localStorage.getItem('mesh_callsign');
    if (savedToken && savedName) {
      myName = savedName;
      isLoggedIn = true;
      connectToMesh();
    }
  });

  async function handleUserLogin(event) {
    const { name, pass } = event.detail;
    loginError = "";

    try {
      const response = await fetch(`http://${serverIP}:3000/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callsign: name, password: pass })
      });

      const data = await response.json();

      if (response.ok) {
        myName = data.callsign;
        localStorage.setItem('mesh_callsign', myName);
        localStorage.setItem('mesh_token', data.token);
        isLoggedIn = true;
        connectToMesh();
      } else {
        loginError = data.error || "Помилка авторизації";
      }
    } catch (error) {
      loginError = "Сервер недоступний. Перевірте з'єднання з Mesh.";
    }
  }

  function connectToMesh() {
    const token = localStorage.getItem('mesh_token');

    socket = io(`http://${serverIP}:3000`, {
      auth: { token: token }
    });

    socket.on('connect_error', (err) => {
      console.error("Помилка підключення:", err.message);
      loginError = "Сесія закінчилась. Авторизуйтесь знову.";
      isLoggedIn = false;
      localStorage.removeItem('mesh_token');
      localStorage.removeItem('mesh_callsign');
    });

    socket.on('connect', () => {
      isConnected = true;
      socket.emit('join', { ip: myIP, name: myName, status: 'online' });
    });

    socket.on('joined', (userData) => {
      myIP = userData.ip;
    });

    socket.on('new_file', (fileData) => {
      files = [...files, fileData];
    });

    socket.on('disconnect', () => {
      isConnected = false;
      onlineUsers = [];
    });

    socket.on('users_update', (users) => {
      onlineUsers = users;
    });

    socket.on('message', (msg) => {
      if (msg.sender === myName) {
        msg.type = 'sent';
        msg.sender = 'Ти';
      }
      messages = [...messages, msg];
    });
  }

  function handleSendMessage(event) {
    const textToSend = event.detail;
    if (socket) {
      socket.emit('send_message', textToSend);
    }
  }
</script>

{#if !isLoggedIn}
  <AuthScreen errorMsg={loginError} on:login={handleUserLogin} />
{:else}
  <main class="dashboard">
    <Sidebar {isConnected} {myIP} {onlineUsers} />
    <Chat {messages} on:send={handleSendMessage} />
    <FileShare {files} {serverIP} />
  </main>
{/if}

<style>
  :global(body) {
    margin: 0;
    font-family: 'Inter', system-ui, sans-serif;
    background-color: #0f172a;
    color: #e2e8f0;
  }

  .dashboard {
    display: grid;
    grid-template-columns: 250px 1fr 300px;
    height: 100vh;
    overflow: hidden;
  }
</style>