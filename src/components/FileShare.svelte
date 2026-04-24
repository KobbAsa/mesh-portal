<script>
    export let files = [];
    let fileInput;

    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData
            });

            fileInput.value = "";
        } catch (error) {
            console.error("Помилка завантаження:", error);
            alert("Не вдалося завантажити файл в меш.");
        }
    }
</script>

<section class="files-area">
    <div class="panel-header">
        <h2>Файлообмінник</h2>
    </div>

    <div class="dropzone">
        <p>📥 Завантажити в меш</p>

        <input
                type="file"
                bind:this={fileInput}
                on:change={handleFileUpload}
                style="display: none;"
        />

        <button class="upload-btn" on:click={() => fileInput.click()}>
            Оберіть файл на диску
        </button>
    </div>

    <div class="file-list">
        {#each files as file}
            <div class="file-item">
                <span class="icon">📄</span>
                <div class="file-info">
          <span class="name" title={file.name}>
            {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
          </span>
                    <span class="size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <a href={file.url} target="_blank" class="download-btn" download>⬇️</a>
            </div>
        {/each}

        {#if files.length === 0}
            <p class="empty-state">Файлів поки немає. Завантажте перший!</p>
        {/if}
    </div>
</section>

<style>
    section { display: flex; flex-direction: column; height: 100%; border-left: 1px solid #1e293b;}
    .panel-header { padding: 15px 20px; border-bottom: 1px solid #1e293b; background-color: #141e33; }
    .panel-header h2 { margin: 0; font-size: 1.1rem; color: #94a3b8; }
    .files-area { background-color: #0b1120; }
    .dropzone { margin: 20px; padding: 30px; border: 2px dashed #334155; border-radius: 8px; text-align: center; color: #94a3b8; transition: 0.2s; }
    .dropzone:hover { border-color: #38bdf8; background: rgba(56, 189, 248, 0.05); }
    .upload-btn { margin-top: 10px; padding: 8px 16px; background: #1e293b; border: 1px solid #334155; color: white; border-radius: 4px; cursor: pointer; }
    .upload-btn:hover { background: #334155; }
    .file-list { padding: 0 20px; overflow-y: auto; flex-grow: 1;}
    .empty-state { text-align: center; color: #64748b; font-size: 0.85rem; margin-top: 20px; }
    .file-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #1e293b; border-radius: 6px; margin-bottom: 10px; }
    .file-item .icon { font-size: 1.5rem; }
    .file-item .file-info { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
    .file-item .name { font-size: 0.9rem; font-weight: 500; white-space: nowrap; }
    .file-item .size { font-size: 0.75rem; color: #94a3b8; }
    .file-item .download-btn { background: transparent; border: none; cursor: pointer; font-size: 1.2rem; opacity: 0.7; text-decoration: none; }
    .file-item .download-btn:hover { opacity: 1; }
</style>