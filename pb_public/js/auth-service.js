

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