import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './assets/Banner.css';

const Banner = () => {
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    const db = getDatabase();
    const categoriasRef = ref(db, 'categorias');

    onValue(categoriasRef, (snapshot) => {
      const categoriasData = snapshot.val();

      if (categoriasData) {
        const categoriasArray = Object.entries(categoriasData).map(([id, data]) => ({
          id,
          ...data
        }));
        setCategorias(categoriasArray);
      }
    });

    return () => {
      // Detener la escucha de cambios al desmontar el componente
      // off(categoriasRef, 'value');
    };
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    adaptiveHeight: true,
  };

  return (
    <Container fluid className="px-0 banner-container-mobile">
      <div className="banner-container">
        <Slider {...settings}>
          {categorias.map((categoria) => (
            <div key={categoria.id} className="banner-slide">
              <Link to={`/categoria/${categoria.id}`}>
                <img
                  src={categoria.imagen}
                  alt={categoria.nombre}
                  className="img-fluid w-100 banner-image"
                />
                <p className="banner-caption text-center">{categoria.nombre}</p>
              </Link>
            </div>
          ))}
        </Slider>
      </div>
    </Container>
  );
};

export default Banner;