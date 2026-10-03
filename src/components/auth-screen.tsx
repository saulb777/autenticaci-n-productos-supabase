
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/database/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registro, setRegistro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const autenticar = async () => {
    setMensaje('');

    if (!email.trim() || !password) {
      setMensaje('Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      if (registro) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (!data.session) {
          setMensaje(
            'Registro exitoso. Revisa tu correo si se requiere confirmación.'
          );
        } else {
          setMensaje('Cuenta creada correctamente.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
      }
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {registro ? 'Crear cuenta' : 'Iniciar sesión'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {mensaje !== '' && (
        <Text style={styles.mensaje}>{mensaje}</Text>
      )}

      <Pressable
        style={styles.button}
        onPress={autenticar}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {registro ? 'Registrarse' : 'Entrar'}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => {
          setRegistro(!registro);
          setMensaje('');
        }}
      >
        <Text style={styles.link}>
          {registro
            ? 'Ya tengo una cuenta'
            : 'Crear una cuenta'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#72bbcf',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
  },
  input: {
    borderWidth: 1,
    borderColor: '#292323',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 20,
  },
  button: {
    backgroundColor: '#04082e',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    color: '#000000',
    marginTop: 20,
  },
  mensaje: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 15,
  },
});
