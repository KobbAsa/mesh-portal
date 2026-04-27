<script>
    import { createEventDispatcher, tick } from 'svelte';

    export let messages = [];
    let currentMessage = "";
    let chatContainer;

    const dispatch = createEventDispatcher();

    $: if (messages.length) {
        scrollToBottom();
    }

    async function scrollToBottom() {
        if (chatContainer) {
            await tick();
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    function sendMessage() {
        if (currentMessage.trim() !== "") {
            dispatch('send', currentMessage.trim());
            currentMessage = "";
        }
    }

    function handleKeydown(event) {
        if (event.key === 'Enter') sendMessage();
    }
</script>

<section class="chat-area">
    <div class="messages" bind:this={chatContainer}>
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
                placeholder="Transmit message..."
                bind:value={currentMessage}
                on:keydown={handleKeydown}
                maxlength="1024"
                autocomplete="off"
        />
        <button on:click={sendMessage}>Send</button>
    </div>
</section>

<style>
    .chat-area {
        display: flex;
        flex-direction: column;
        border-right: 1px solid #1e293b;
        height: 100%;
        background-color: #0f172a;
        min-height: 0;
        overflow: hidden;
    }

    .messages {
        flex-grow: 1;
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        scroll-behavior: smooth;
    }

    .msg {
        padding: 10px 14px;
        border-radius: 8px;
        max-width: 80%;
        width: fit-content;
        word-wrap: break-word;
    }

    .msg.system {
        align-self: center;
        background: transparent;
        color: #64748b;
        font-size: 0.8rem;
        font-style: italic;
    }

    .msg.received {
        align-self: flex-start;
        background-color: #1e293b;
        border-left: 3px solid #38bdf8;
    }

    .msg.sent {
        align-self: flex-end;
        background-color: #0284c7;
        color: white;
    }

    .msg .sender {
        font-weight: bold;
        font-size: 0.8rem;
        display: block;
        margin-bottom: 3px;
        opacity: 0.8;
    }

    .input-area {
        padding: 20px;
        border-top: 1px solid #1e293b;
        display: flex;
        gap: 10px;
        background-color: #141e33;
    }

    .input-area input {
        flex-grow: 1;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #334155;
        background: #0f172a;
        color: white;
        outline: none;
    }

    .input-area input:focus {
        border-color: #38bdf8;
    }

    .input-area button {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        background: #38bdf8;
        color: #0f172a;
        font-weight: bold;
        cursor: pointer;
        transition: 0.2s;
    }

    .input-area button:hover {
        background: #7dd3fc;
    }
</style>