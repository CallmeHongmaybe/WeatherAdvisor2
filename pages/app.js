import dynamic from 'next/dynamic';
import Head from 'next/head';
import SearchBar from '../components/SearchBar';
import CityInfo from '../components/CityInfo';
import { useReducer, createContext, useMemo, useEffect } from 'react'


// geoJSON docs: https://tools.ietf.org/html/rfc7946 
// geoJSON charter: https://datatracker.ietf.org/wg/geojson/charter/
// css: https://medium.com/dvt-engineering/css-flexboxs-a-useful-alternative-to-div-and-float-551c98d26aeb

// ALWAYS CONSULT THESE EXAMPLES BEFORE MOVING ON: https://github.com/vercel/next.js/tree/master/examples

const NoSSRMap = dynamic(() => import('../components/Map'), {
    ssr: false
});

export const ACTIONS = {
    GET_CITY_INFO: "getCityInfo",
    UPDATE_FORECAST: "UpdateForecast",
    UPDATE_CLIMATE: "UpdateClimate",
    TOGGLE_LAYER: "EnableLayers"
}

function reducer(info, { type, payload }) {
    switch (type) {
        case ACTIONS.GET_CITY_INFO:
            return { ...payload }
        case ACTIONS.UPDATE_CLIMATE:
            return { ...info, climate: payload.climate, averages: payload.averages }
        case ACTIONS.UPDATE_FORECAST:
            return { ...info, forecast: payload }
        case ACTIONS.TOGGLE_LAYER:
            return { ...info, show_layer: !info.show_layer }
        default: return info
    }
}

export const InfoContext = createContext()

// https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation 

export default function App() {    
    const [city, dispatch] = useReducer(reducer, {
        country: "AU",
        name: "Sydney",
        lat: -33.86785,
        lng: 151.20732,
        climate: null,
        averages: null,
        forecast: null,
        show_layer: false
    })
    
    const memoizedValues = useMemo(() => {
        return { city, dispatch }
    }, [city, dispatch])

    // used in conjunction with useContext: https://hswolff.com/blog/how-to-usecontext-with-usereducer/
    // memoized values only change when either of these 2 deps actually changes () by refs ). 

    return (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100vw', height: '100vh' }}>
            <Head>
                <title>Weather advisor 2</title>
            </Head>
            <InfoContext.Provider value={memoizedValues}>
                <div style={{ width: '45vw' }}>
                    <SearchBar />
                    <CityInfo {...city} />
                </div>
                <NoSSRMap />
            </InfoContext.Provider>

        </div>
    )
}

// export async function getStaticProps(ctx) {

//     // steps 
//     // 1. geolocate by any means 
//     // 2. collect the lat and lng then query the database for the nearest location. MOE 1 km. 
//     // 3. Cache the API result somewhere: it can be cookies 
//     // 3. export the document 

    

//      // treat this as a hashtag like : https://sth.org/#
// }


// climate icon: 
// catalog: Icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a>
// climate extremes: Icons made by <a href="https://www.flaticon.com/authors/surang" title="surang">surang</a> from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a>
// country by climate: Icons made by <a href="https://www.flaticon.com/authors/eucalyp" title="Eucalyp">Eucalyp</a> from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a>
