
export async function realizarLogin(email, senha) {
    try{
        const pb = window.pb;
        if (!pb) {
            throw new Error('PocketBase não está inicializado.');
        }

        const authData = await pb.collection('users').authWithPassword(email, senha);
        console.log('Login realizado com sucesso:', authData.record.email);
        return authData;

    } catch (err) {
        console.error('Erro ao realizar login:', err);
        throw err;
    }
}

export async function realizarLogout() {
    try {
        const pb = window.pb;
        if (!pb) {
            throw new Error('PocketBase não está inicializado.');
        }

        await pb.authStore.clear();
        console.log('Logout realizado com sucesso');
    } catch (err) {
        console.error('Erro ao realizar logout:', err);
        throw err;
    }
}

export function estaAutenticado() {
    const pb = window.pb;
    if (!pb) {
        return false;
    }
    
    return pb.authStore.isValid;
}

export function obterUsuarioAtual() {
    const pb = window.pb;
    if (!estaAutenticado()) {
        return null;
    }
    return pb.authStore.model;
}