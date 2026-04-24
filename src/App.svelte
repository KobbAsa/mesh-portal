<script>
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';

  import Sidebar from './components/Sidebar.svelte';
  import Chat from './components/Chat.svelte';
  import FileShare from './components/FileShare.svelte';
  import AuthScreen from './components/AuthScreen.svelte';

  let isLoggedIn = false;
  let loginError = "";
  let myIP = "З'єднання...";
  let myName = "";

  let isConnected = false;
  let onlineUsers = [];
  let messages = [];
  let files = [];
  let socket;

  const localADCache = {
    "admin": "qwerty",
    "commander": "bunker123",
    "diploma1": "1111"
  };

  onMount(() => {
    const savedName = localStorage.getItem('mesh_callsign');
    if (savedName) {
      myName = savedName;
      isLoggedIn = true;
      connectToMesh();
    }
  });

  function handleUserLogin(event) {
    const { name, pass } = event.detail;
    const usernameKey = name.toLowerCase();

    if (localADCache[usernameKey] && localADCache[usernameKey] === pass) {
      loginError = "";
      myName = name;
      localStorage.setItem('mesh_callsign', myName);
      isLoggedIn = true;
      connectToMesh();
    } else if (!localADCache[usernameKey]) {
      loginError = "Обліковий запис не знайдено в локальному кеші.";
    } else {
      loginError = "Відмова у доступі: Невірний пароль.";
    }
  }

  function connectToMesh() {
    socket = io('http://localhost:3000');

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
    <FileShare {files} />
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