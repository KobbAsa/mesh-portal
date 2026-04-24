<script>
    import { createEventDispatcher } from 'svelte';

    export let messages = [];
    let currentMessage = "";

    const dispatch = createEventDispatcher();

    function sendMessage() {
        if (currentMessage.trim() !== "") {
            dispatch('send', currentMessage);
            currentMessage = "";
        }
    }

    function handleKeydown(event) {
        if (event.key === 'Enter') sendMessage();
    }
</script>

<section class="chat-area">
    <div class="messages">
        {#each messages as msg}
            <div class="msg {msg.type}">
                {#if msg.type !== 'system'}
                    <span class="sender">{msg.sender}:</span>
                {/if}
                <span class="text">{msg.text}</span>
            </div>
        {/each}
    </div>

    <div class="input-area">
        <input
                type="text"
                placeholder="Введіть повідомлення..."
                bind:value={currentMessage}
                on:keydown={handleKeydown}
        />
        <button on:click={sendMessage}>Відправити</button>
    </div>
</section>

<style>
    section { display: flex; flex-direction: column; border-right: 1px solid #1e293b; height: 100%; }
    .chat-area { flex-grow: 1; background-color: #0f172a; }
    .messages { flex-grow: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
    .msg { padding: 10px 14px; border-radius: 8px; max-width: 80%; width: fit-content; }
    .msg.system { align-self: center; background: transparent; color: #64748b; font-size: 0.8rem; font-style: italic; }
    .msg.received { align-self: flex-start; background-color: #1e293b; border-left: 3px solid #38bdf8; }
    .msg.sent { align-self: flex-end; background-color: #0284c7; color: white; }
    .msg .sender { font-weight: bold; font-size: 0.8rem; display: block; margin-bottom: 3px; opacity: 0.8; }
    .input-area { padding: 20px; border-top: 1px solid #1e293b; display: flex; gap: 10px; background-color: #141e33; }
    .input-area input { flex-grow: 1; padding: 12px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: white; outline: none; }
    .input-area input:focus { border-color: #38bdf8; }
    .input-area button { padding: 12px 24px; border: none; border-radius: 6px; background: #38bdf8; color: #0f172a; font-weight: bold; cursor: pointer; transition: 0.2s; }
    .input-area button:hover { background: #7dd3fc; }
</style>