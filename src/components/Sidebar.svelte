<script>
    export let isConnected;
    export let myIP;
    export let onlineUsers = [];

    function handleLogout() {
        localStorage.removeItem('mesh_callsign');
        localStorage.removeItem('mesh_token');
        window.location.reload();
    }
</script>

<aside class="sidebar">
    <div class="logo-area">
        <h1>🚨 MeshNet</h1>
        <p class="subtitle">Emergency Portal</p>
    </div>

    <div class="my-status">
        <div class="status-indicator {isConnected ? 'green' : 'red'}"></div>
        <div class="ip-info">
            <span class="label">Local Node:</span>
            <span class="value">{myIP}</span>
        </div>
    </div>

    <div class="users-list">
        <h3>Active Nodes ({onlineUsers.filter(u => u.status === 'online').length})</h3>
        <ul>
            {#each onlineUsers as user}
                <li class="{user.status}">
                    <span class="dot"></span>
                    <span class="name">{user.name}</span>
                    <span class="ip">{user.ip}</span>
                </li>
            {/each}
        </ul>
    </div>

    <div class="logout-area">
        <button class="logout-btn" on:click={handleLogout}>
            <span>🔴</span> Disconnect
        </button>
    </div>
</aside>

<style>
    aside {
        display: flex;
        flex-direction: column;
        border-right: 1px solid #1e293b;
        height: 100%;
        min-height: 0;
        overflow: hidden;
    }

    .sidebar {
        background-color: #0b1120;
    }

    .logo-area {
        padding: 20px;
        text-align: center;
        border-bottom: 1px solid #1e293b;
    }

    .logo-area h1 {
        margin: 0;
        font-size: 1.5rem;
        color: #f8fafc;
    }

    .logo-area .subtitle {
        margin: 5px 0 0;
        font-size: 0.8rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .my-status {
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 15px;
        border-bottom: 1px solid #1e293b;
        background: #111827;
    }

    .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }

    .green {
        background-color: #10b981;
        box-shadow: 0 0 10px #10b981;
    }

    .red {
        background-color: #ef4444;
        box-shadow: 0 0 10px #ef4444;
    }

    .ip-info {
        display: flex;
        flex-direction: column;
    }

    .ip-info .label {
        font-size: 0.75rem;
        color: #64748b;
        text-transform: uppercase;
    }

    .ip-info .value {
        font-weight: bold;
        font-family: monospace;
        font-size: 1.1rem;
        color: #38bdf8;
    }

    .users-list {
        padding: 20px;
        flex-grow: 1;
        overflow-y: auto;
    }

    .users-list h3 {
        margin-top: 0;
        font-size: 0.9rem;
        color: #94a3b8;
        text-transform: uppercase;
    }

    .users-list ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .users-list li {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 0;
        border-bottom: 1px solid #1e293b;
    }

    .users-list li .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .users-list li.online .dot {
        background-color: #10b981;
    }

    .users-list li.offline {
        opacity: 0.5;
    }

    .users-list li.offline .dot {
        background-color: #64748b;
    }

    .users-list li .name {
        flex-grow: 1;
        font-size: 0.9rem;
    }

    .users-list li .ip {
        font-family: monospace;
        font-size: 0.8rem;
        color: #64748b;
    }

    .logout-area {
        padding: 20px;
        border-top: 1px solid #1e293b;
        background-color: #0f172a;
    }
    .logout-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 12px;
        background: rgba(239, 68, 68, 0.05);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
    }
    .logout-btn:hover {
        background: rgba(239, 68, 68, 0.15);
        border-color: #ef4444;
        transform: translateY(-1px);
    }
</style>