// Solução SIMPLES e ROBUSTA para teclado PWA
(function() {
    'use strict';
    
    console.log('PWA Keyboard Fix - Iniciando...');
    
    // Detecta se está rodando como PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true ||
                  document.referrer.includes('android-app://');
    
    console.log('É PWA?', isPWA);
    
    function fixInputs() {
        // Seleciona TODOS os inputs e textareas
        const inputs = document.querySelectorAll('input, textarea');
        console.log('Inputs encontrados:', inputs.length);
        
        inputs.forEach((input, index) => {
            console.log(`Configurando input ${index}:`, input.type, input.id);
            
            // Remove atributos que podem bloquear
            input.removeAttribute('readonly');
            input.removeAttribute('disabled');
            
            // Força propriedades essenciais
            input.style.pointerEvents = 'auto';
            input.style.userSelect = 'text';
            input.style.webkitUserSelect = 'text';
            input.style.touchAction = 'manipulation';
            
            // Adiciona inputmode se não existir
            if (!input.hasAttribute('inputmode')) {
                if (input.type === 'number') {
                    input.setAttribute('inputmode', 'numeric');
                } else {
                    input.setAttribute('inputmode', 'text');
                }
            }
            
            // Event listeners SIMPLES
            input.addEventListener('touchstart', function(e) {
                console.log('TouchStart no input:', this.id || this.type);
                this.focus();
            }, { passive: true });
            
            input.addEventListener('click', function(e) {
                console.log('Click no input:', this.id || this.type);
                this.focus();
            });
            
            input.addEventListener('focus', function(e) {
                console.log('Focus no input:', this.id || this.type);
                // Força o cursor no final
                setTimeout(() => {
                    if (this.value) {
                        this.setSelectionRange(this.value.length, this.value.length);
                    }
                }, 10);
            });
        });
    }
    
    // Executa quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixInputs);
    } else {
        fixInputs();
    }
    
    // Reexecuta quando novos elementos são adicionados
    const observer = new MutationObserver(fixInputs);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('PWA Keyboard Fix - Configurado!');
})();

