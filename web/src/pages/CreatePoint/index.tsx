import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Link, useHistory } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { Map, TileLayer, Marker } from "react-leaflet";
import axios from "axios";
import { LeafletMouseEvent } from "leaflet";
import api from "../../services/api";

import "./styles.css";

import Dropzone from "../../components/Dropzone";

import logo from "../../assets/logo.svg";

// array ou objet: manualmente informar o tipo de variável

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface IBGEUFResponse {
  sigla: string;
}

interface IBGEUFCityResponse {
  nome: string;
}

const CreatePoint = () => {
  // Dados iniciais
  const [items, setItems] = useState<Item[]>([]);
  const [ufs, setUfs] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File>();

  const [initialPosition, setInitialPosition] = useState<[number, number]>([
    0,
    0,
  ]);

  // Dados do formulário
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
  });

  // Dados do Select
  const [selectedUF, setSelectedUF] = useState("0");
  const [selectedCity, setSelectedCity] = useState("0");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([
    0,
    0,
  ]);

  // Localização
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      setInitialPosition([latitude, longitude]);
    });
  }, []);

  const history = useHistory();

  //Lampadas, baterias, lixo...setSelectedUF
  useEffect(() => {
    api.get("items").then((response) => {
      setItems(response.data);
    });
  }, []);
  // Regiões do IBGE
  useEffect(() => {
    axios
      .get<IBGEUFResponse[]>(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
      )
      .then((response) => {
        const ufInitials = response.data.map((uf) => uf.sigla);

        setUfs(ufInitials);
      });
  }, []);

  // Carregar as cidades sempre que a UF mudar
  useEffect(() => {
    if (selectedUF === "0") {
      return;
    }
    axios
      .get<IBGEUFCityResponse[]>(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`
      )
      .then((response) => {
        const cityNames = response.data.map((city) => city.nome);

        setCities(cityNames);
      });
  }, [selectedUF]);
  // Armazena o no estado UF
  function handleSelectUF(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value;
    setSelectedUF(uf);
  }
  // Armazena o no estado selectedCity
  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value;
    setSelectedCity(city);
  }
  // Ao clickar marca um ponto no map
  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([event.latlng.lat, event.latlng.lng]);
    console.log(selectedPosition);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormData({ ...formData, [name]: value });
  }

  function handleSelectItem(id: number) {
    const alredySelected = selectedItems.findIndex((item) => item === id);
    if (alredySelected >= 0) {
      const filteredItems = selectedItems.filter((item) => item !== id);
      setSelectedItems(filteredItems);
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const { name, email, whatsapp } = formData;
    const uf = selectedUF;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems;

    const data = new FormData();

    data.append("name", name);
    data.append("email", email);
    data.append("whatsapp", whatsapp);
    data.append("uf", uf);
    data.append("city", city);
    data.append("latitude", String(latitude));
    data.append("longitude", String(longitude));
    data.append("items", items.join(','));
    
    if(selectedFile){
      data.append("image", selectedFile);
    }

    await api.post("points", data);

    alert("Ponto de coleta criado!");

    history.push("/");
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />
        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>
      <form onSubmit={handleSubmit}>
        <h1>
          Cadastro do <br /> ponto de coleta
        </h1>

        <Dropzone onFileUploaded={setSelectedFile} />

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>
        </fieldset>

        <div className="field">
          <label htmlFor="name">Nome da identidade</label>
          <input
            onChange={handleInputChange}
            type="text"
            name="name"
            id="name"
          />
        </div>
        <div className="field-group">
          <div className="field">
            <label htmlFor="name">E-mail</label>
            <input
              onChange={handleInputChange}
              type="text"
              name="email"
              id="email"
            />
          </div>
          <div className="field">
            <label htmlFor="name">WhatsApp</label>
            <input
              onChange={handleInputChange}
              type="text"
              name="whatsapp"
              id="whatsapp"
            />
          </div>
        </div>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço</span>
          </legend>
          <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={selectedPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select
                name="uf"
                id="uf"
                value={selectedUF}
                onChange={handleSelectUF}
              >
                <option value="0">Selecione uma UF</option>

                {ufs.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select
                onChange={handleSelectCity}
                value={selectedCity}
                name="city"
                id="city"
              >
                <option value="0">Selecione uma cidade</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Itens de coleta</h2>
          </legend>

          <ul className="items-grid">
            {items.map((item) => (
              <li
                key={item.id}
                onClick={() => handleSelectItem(item.id)}
                className={selectedItems.includes(item.id) ? "selected" : ""}
              >
                <img src={item.image_url} alt={item.title} />
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>
        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  );
};

export default CreatePoint;
