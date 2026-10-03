import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { supabase } from '@/database/supabase';

type Producto = {
  id: number;
  nombre: string;
  proveedor: string;
  precio: number;
  stock: number;
};

export default function ProductsScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);

  const [nombre, setNombre] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');

  const [modalVisible, setModalVisible] = useState(false);

  const [productoEditando, setProductoEditando] =
    useState<Producto | null>(null);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // ==========================
  // CARGAR PRODUCTOS
  // ==========================

  const cargarProductos = async () => {
    setCargando(true);

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error al cargar:', error);

      if (Platform.OS === 'web') {
        window.alert(error.message);
      } else {
        Alert.alert('Error', error.message);
      }
    } else {
      setProductos(data || []);
    }

    setCargando(false);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // ==========================
  // LIMPIAR FORMULARIO
  // ==========================

  const limpiarFormulario = () => {
    setNombre('');
    setProveedor('');
    setPrecio('');
    setStock('');
    setProductoEditando(null);
  };

  // ==========================
  // NUEVO PRODUCTO
  // ==========================

  const abrirNuevo = () => {
    limpiarFormulario();
    setModalVisible(true);
  };

  // ==========================
  // EDITAR PRODUCTO
  // ==========================

  const abrirEditar = (producto: Producto) => {
    setProductoEditando(producto);

    setNombre(producto.nombre);
    setProveedor(producto.proveedor);
    setPrecio(String(producto.precio));
    setStock(String(producto.stock));

    setModalVisible(true);
  };

  // ==========================
  // GUARDAR PRODUCTO
  // ==========================

  const guardarProducto = async () => {
    if (
      !nombre.trim() ||
      !proveedor.trim() ||
      !precio.trim() ||
      !stock.trim()
    ) {
      if (Platform.OS === 'web') {
        window.alert('Completa todos los campos.');
      } else {
        Alert.alert('Aviso', 'Completa todos los campos.');
      }

      return;
    }

    const precioNum = Number(precio);
    const stockNum = Number(stock);

    if (
      !Number.isFinite(precioNum) ||
      precioNum < 0 ||
      !Number.isInteger(stockNum) ||
      stockNum < 0
    ) {
      if (Platform.OS === 'web') {
        window.alert('Verifica el precio y el stock.');
      } else {
        Alert.alert('Error', 'Verifica el precio y el stock.');
      }

      return;
    }

    setGuardando(true);

    try {
      const datos = {
        nombre: nombre.trim(),
        proveedor: proveedor.trim(),
        precio: precioNum,
        stock: stockNum,
      };

      let error;

      // EDITAR
      if (productoEditando) {
        const resultado = await supabase
          .from('products')
          .update(datos)
          .eq('id', productoEditando.id);

        error = resultado.error;
      }

      // AGREGAR
      else {
        const resultado = await supabase
          .from('products')
          .insert(datos);

        error = resultado.error;
      }

      if (error) {
        console.error('Error de Supabase:', error);

        if (Platform.OS === 'web') {
          window.alert('Error al guardar: ' + error.message);
        } else {
          Alert.alert('Error al guardar', error.message);
        }

        return;
      }

      const estabaEditando = productoEditando !== null;

      setModalVisible(false);

      limpiarFormulario();

      await cargarProductos();

      if (Platform.OS === 'web') {
        window.alert(
          estabaEditando
            ? 'Producto actualizado correctamente.'
            : 'Producto guardado correctamente.'
        );
      } else {
        Alert.alert(
          'Éxito',
          estabaEditando
            ? 'Producto actualizado correctamente.'
            : 'Producto guardado correctamente.'
        );
      }
    } catch (error) {
      console.error(error);

      const mensaje =
        error instanceof Error
          ? error.message
          : String(error);

      if (Platform.OS === 'web') {
        window.alert(mensaje);
      } else {
        Alert.alert('Error', mensaje);
      }
    } finally {
      setGuardando(false);
    }
  };

  // ==========================
  // ELIMINAR PRODUCTO
  // ==========================

  const eliminarProducto = async (id: number) => {
    const eliminar = async () => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar:', error);

        if (Platform.OS === 'web') {
          window.alert(
            'Error al eliminar: ' + error.message
          );
        } else {
          Alert.alert(
            'Error al eliminar',
            error.message
          );
        }

        return;
      }

      await cargarProductos();

      if (Platform.OS === 'web') {
        window.alert(
          'Producto eliminado correctamente.'
        );
      } else {
        Alert.alert(
          'Éxito',
          'Producto eliminado correctamente.'
        );
      }
    };

    // COMPUTADORA / NAVEGADOR
    if (Platform.OS === 'web') {
      const confirmar = window.confirm(
        '¿Seguro que deseas eliminar este producto?'
      );

      if (confirmar) {
        await eliminar();
      }
    }

    // ANDROID / IPHONE
    else {
      Alert.alert(
        'Eliminar producto',
        '¿Seguro que deseas eliminar este producto?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: eliminar,
          },
        ]
      );
    }
  };

  // ==========================
  // CERRAR SESIÓN
  // ==========================

  const cerrarSesion = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      if (Platform.OS === 'web') {
        window.alert(error.message);
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  // ==========================
  // MOSTRAR PRODUCTO
  // ==========================

  const renderProducto = ({
    item,
  }: {
    item: Producto;
  }) => (
    <View style={styles.producto}>
      <View style={styles.info}>
        <Text style={styles.nombre}>
          {item.nombre}
        </Text>

        <Text>
          Proveedor: {item.proveedor}
        </Text>

        <Text>
          Precio: Q
          {Number(item.precio).toFixed(2)}
        </Text>

        <Text>
          Stock: {item.stock}
        </Text>
      </View>

      <View style={styles.botones}>
        <TouchableOpacity
          style={styles.botonEditar}
          onPress={() => abrirEditar(item)}
        >
          <Text style={styles.textoBoton}>
            Editar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonEliminar}
          onPress={() =>
            eliminarProducto(item.id)
          }
        >
          <Text style={styles.textoBoton}>
            Eliminar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ==========================
  // PANTALLA
  // ==========================

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>
        Productos
      </Text>

      <View style={styles.encabezado}>
        <TouchableOpacity
          style={styles.botonNuevo}
          onPress={abrirNuevo}
        >
          <Text style={styles.textoBoton}>
            + Nuevo producto
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonSalir}
          onPress={cerrarSesion}
        >
          <Text style={styles.textoBoton}>
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) =>
            String(item.id)
          }
          renderItem={renderProducto}
          ListEmptyComponent={
            <Text style={styles.vacio}>
              No hay productos registrados.
            </Text>
          }
          contentContainerStyle={{
            paddingBottom: 20,
          }}
          refreshing={cargando}
          onRefresh={cargarProductos}
        />
      )}


      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View style={styles.fondoModal}>
          <View style={styles.modal}>
            <Text style={styles.tituloModal}>
              {productoEditando
                ? 'Editar producto'
                : 'Nuevo producto'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={nombre}
              onChangeText={setNombre}
            />

            <TextInput
              style={styles.input}
              placeholder="Proveedor"
              value={proveedor}
              onChangeText={setProveedor}
            />

            <TextInput
              style={styles.input}
              placeholder="Precio"
              value={precio}
              onChangeText={setPrecio}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Stock"
              value={stock}
              onChangeText={setStock}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={styles.botonGuardar}
              onPress={guardarProducto}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator
                  color="#fff"
                />
              ) : (
                <Text
                  style={styles.textoBoton}
                >
                  {productoEditando
                    ? 'Actualizar'
                    : 'Guardar'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonCancelar}
              onPress={() => {
                setModalVisible(false);
                limpiarFormulario();
              }}
              disabled={guardando}
            >
              <Text
                style={styles.textoCancelar}
              >
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 20,
    backgroundColor: '#2f423a',
  },

  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8e97a4',
  },

  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },

  botonNuevo: {
    backgroundColor: '#0b2765',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },

  botonSalir: {
    backgroundColor: '#7c1313',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  producto: {
    backgroundColor: '#444998',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },

  info: {
    gap: 5,
  },

  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },

  botones: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  botonEditar: {
    backgroundColor: '#01855b',
    padding: 10,
    borderRadius: 6,
  },

  botonEliminar: {
    backgroundColor: '#7e0f0f',
    padding: 10,
    borderRadius: 6,
  },

  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  vacio: {
    textAlign: 'center',
    marginTop: 30,
    color: '#64748b',
  },

  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },

  modal: {
    backgroundColor: '#54ca93',
    padding: 20,
    borderRadius: 12,
  },

  tituloModal: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },

  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },

  botonGuardar: {
    backgroundColor: '#939496',
    padding: 14,
    borderRadius: 8,
    marginTop: 5,
  },

  botonCancelar: {
    padding: 12,
    alignItems: 'center',
    marginTop: 5,
  },

  textoCancelar: {
    color: '#475569',
    fontWeight: 'bold',
  },
});