import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react"; 
import * as SecureStore from 'expo-secure-store';

interface AuthProps {
    authState?: {token: string | null; authenticated: boolean | null };
    onRegister?: (email: string, password: string, name: string) => Promise<any>;
    onLogin?: (email: string, password: string,) => Promise<any>;
    onLogout?: () => Promise<any>;
}

const TOKEN_KEY = 'my-jwt';
export const API_URL = 'http://localhost:3000';
const AuthContext  = createContext<AuthProps>({});

export const useAuth  = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({children}: any) => {
    const [authState, setAuthState] = useState<{
        token: string | null;
        authenticated: boolean | null;
    }>({
        token: null,
        authenticated: null,
    });

    useEffect(() => {
        const loadToken = async () => {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            console.log("stored: ", token);
            

            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                setAuthState({
                    token: token,
                    authenticated: true,
                });
            }
        }
        
        loadToken();
    }, [])

    const register = async (email: string, password: string, name: string) => {
        try{
            return await axios.post(`${API_URL}/register`, { email, password, name});
        } catch (e) {
            return { error: true, msg: (e as any).response.data.msg };
        }
    };

    const login = async (email: string, password: string) => {
        try{
            const result = await axios.post(`${API_URL}/login`, { email, password});

            console.log("🚀 ~ file: AuthContext.tsx:41 ~ login ~ result:", result);

            axios.defaults.headers.common['Authorization'] = `Bearer ${result.data.token}`;

            await SecureStore.setItemAsync(TOKEN_KEY, result.data.token);

            
            
            setAuthState({
                token: result.data.token,
                authenticated: true,
            });
        return result;
        } catch (e) {
            return { error: true, msg: (e as any).response.data.msg };
        };
    };

    const logout = async  () => {
        //Borrar token
        await SecureStore.deleteItemAsync(TOKEN_KEY);

        //Actualizar HTTP
        axios.defaults.headers.common['Authorization'] = '';

        //Reiniciar estado de autorizacion
        setAuthState({
            token: null,
            authenticated: false,
        });
    }

    const value = {
        onRegister: register,
        onLogin: login,
        onLogout: logout,
        authState
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};