<script>
    import { createEventDispatcher } from 'svelte';

    let callsign = "";
    let password = "";
    export let errorMsg = ""; // Сюди прилітатиме помилка з головного файлу

    const dispatch = createEventDispatcher();

    function handleLogin() {
        if (callsign.trim().length >= 2 && password.length >= 1) {
            // Відправляємо об'єкт з ім'ям та паролем
            dispatch('login', { name: callsign.trim(), pass: password });
        } else {
            errorMsg = "Введіть позивний та пароль";
        }
    }
</script>

<section class="auth-screen">
    <div class="auth-card">
        <div class="emergency-badge">EMERGENCY ACCESS ONLY</div>
        <h1>MeshNode Terminal</h1>
        <p>Авторизація в локальному сегменті</p>

        <div class="input-group">
            <label for="callsign">Обліковий запис (Callsign)</label>
            <input
                    id="callsign"
                    type="text"
                    bind:value={callsign}
                    placeholder="Наприклад: admin"
                    autocomplete="off"
            />
        </div>

        <div class="input-group">
            <label for="password">Пароль доступу</label>
            <input
                    id="password"
                    type="password"
                    bind:value={password}
                    placeholder="••••••••"
                    on:keydown={(e) => e.key === 'Enter' && handleLogin()}
            />
        </div>

        {#if errorMsg}
            <div class="error-box">{errorMsg}</div>
        {/if}

        <button class="login-btn" on:click={handleLogin}>
            Ініціалізувати з'єднання
        </button>

        <div class="auth-footer">
            <span>Протокол: B.A.T.M.A.N. Adv</span>
            <span>Статус: Auth Required</span>
        </div>
    </div>
</section>

<style>
    /* Всі попередні стилі залишаються, додаємо тільки для помилки */
    .auth-screen { display: flex; justify-content: center; align-items: center; height: 100vh; background: radial-gradient(circle, #1e293b 0%, #0f172a 100%); }
    .auth-card { background: #141e33; padding: 40px; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); width: 100%; max-width: 400px; text-align: center; }
    .emergency-badge { display: inline-block; background: #450a0a; color: #ef4444; padding: 4px 12px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; letter-spacing: 2px; margin-bottom: 20px; border: 1px solid #ef4444; }
    .auth-card h1 { margin: 0 0 10px; font-size: 1.8rem; color: #f8fafc; }
    .auth-card p { color: #64748b; font-size: 0.9rem; margin-bottom: 30px; }
    .input-group { text-align: left; margin-bottom: 20px; }
    .input-group label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; }
    .input-group input { width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #38bdf8; font-family: monospace; font-size: 1.1rem; box-sizing: border-box; outline: none; }
    .input-group input:focus { border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2); }
    .login-btn { width: 100%; padding: 14px; background: #0284c7; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 1rem; cursor: pointer; transition: 0.3s; margin-top: 10px; }
    .login-btn:hover { background: #0ea5e9; transform: translateY(-1px); }
    .auth-footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 0.7rem; color: #475569; text-transform: uppercase; }

    /* Новий стиль для помилки */
    .error-box { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ef4444; padding: 10px; border-radius: 6px; font-size: 0.85rem; margin-bottom: 15px; }
</style>