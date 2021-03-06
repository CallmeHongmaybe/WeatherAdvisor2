import { useContext, useEffect, useState } from "react";
import { Layer, Source, Marker, Popup } from "react-map-gl";
import { ACTIONS, InfoContext } from "../pages/app";
import { useControlPanelStyle, useBackDropStyles } from './Styles'
import { Button, Switch, FormGroup, FormControlLabel, Typography, Tooltip, Backdrop, CircularProgress } from "@material-ui/core";
import InfoIcon from '@material-ui/icons/Info';
import Pin from "../public/pin";

export default function LayerControls({ sideEffect }) {

    const defaultLayerState = {
        layerData: null,
        show: true
    }

    const defaultCluserState = {
        show: false,
        placeData: null,
        popUpInfo: null,
    }
    const { city, dispatch } = useContext(InfoContext)
    const [loading, setLoading] = useState(false)
    const [layerState, setlayerState] = useState(defaultLayerState)
    const [clusterState, setClusterState] = useState(defaultCluserState)
    const controlPanelStyle = useControlPanelStyle()
    const classes = useBackDropStyles()

    const handleLayer = () => setlayerState({
        ...layerState,
        show: !layerState.show
    })

    const handleCluster = () => setClusterState({
        ...clusterState,
        show: !clusterState.show
    })

    const clearAllLayers = () => {
        setlayerState({ ...layerState, show: false })
        setClusterState({ ...clusterState, show: false })
    }

    // hook for getting geoJSON of the climate 
    useEffect(() => {
        if (!city.show_layer) return;
        else {
            setLoading(true)
            fetch(`../api/getClimShapes?climate=${city.climate}`)
                .then(res => res.json())
                .then(res => {
                    setlayerState({
                        ...layerState, layerData: res
                    })
                    // console.log("Climate shape api called")
                    setLoading(false)
                })
        }
    }, [city.show_layer])

    useEffect(() => {
        if (clusterState.show) {
            fetch(`../api/geolocate?climate=${city.climate}&limit=5`)
                .then(res => { setLoading(true); return res.json() })
                .then(res => {

                    const [lng, lat] = res[0].location.coordinates

                    setClusterState({
                        ...clusterState, placeData: res
                    })

                    setLoading(false)

                    sideEffect()({
                        latitude: lat, longitude: lng, zoom: 9
                    })
                })
                // .finally(() => console.log("Place api called"))
                .catch(ex => {
                    throw new Error(ex)
                })
        }
    }, [clusterState.show])

    useEffect(() => {
        setlayerState(defaultLayerState)
        setClusterState(defaultCluserState)
    }, [city.climate])

    // closing event for control panel
    useEffect(() => {
        if (!layerState.show && !clusterState.show) {
            // this will execute no matter what happens after the condition is met 
            let action = setTimeout(() => {
                setlayerState(defaultLayerState)
                setClusterState(defaultCluserState)
                dispatch({
                    type: ACTIONS.TOGGLE_LAYER
                })
            }, 5000);

            return () => clearTimeout(action);
        }
    }, [layerState.show, clusterState.show])

    const ClimateLayer = () => {
        if (!layerState.layerData) return null
        else {
            if (layerState.show) {
                return (
                    <Source id="dataSource" type="geojson" data={layerState.layerData.geojson}>
                        <Layer id="data" type="fill" source="datasource" paint={{
                            "fill-color": layerState.layerData.properties.color,
                            "fill-opacity": 0.7
                        }}></Layer>
                    </Source>
                )
            }
            else return null;
        }
    }

    // to draw a line: 
    // 1. use Layer with type "line"
    // 2. construct a 'LineString' geojson line between your location and this lat/lng 
    // 3. only invoke it on hover event 

    const LocationCluster = () => {
        if (!clusterState.placeData) return null
        else {
            if (clusterState.show) {
                return clusterState.placeData
                    .filter(el => el._id !== city._id)
                    .map(place => {
                        const [lng, lat] = place.location.coordinates
                        const { _id, country, name, distance } = place

                        return (
                            <>
                                <Marker key={place._id} longitude={lng} latitude={lat}>
                                    <Pin color="#0000ff"
                                        onClick={() => {
                                            setClusterState({
                                                ...clusterState,
                                                popUpInfo: { _id, country, name, lat, lng, distance }
                                            })
                                        }
                                        }
                                    ></Pin>
                                </Marker>
                                {
                                    clusterState.popUpInfo && (
                                        <Popup
                                            tipSize={5}
                                            anchor="top"
                                            longitude={clusterState.popUpInfo.lng}
                                            latitude={clusterState.popUpInfo.lat}
                                            closeOnClick={false}
                                            onClose={() => setClusterState({
                                                ...clusterState,
                                                popUpInfo: null
                                            })}
                                        >
                                            <div style={{ padding: 2 }}>
                                                <a onClick={() => dispatch({
                                                    type: ACTIONS.GET_CITY_INFO,
                                                    payload: { ...clusterState.popUpInfo }
                                                })
                                                }>{clusterState.popUpInfo.name}, {clusterState.popUpInfo.country}</a>
                                                <br />
                                                <span>Distance: {Math.floor(clusterState.popUpInfo.distance)} km</span>
                                            </div>
                                        </Popup>
                                    )
                                }
                            </>
                        )
                    })
            }
            else return null
        }
    }

    const ButtonControls = () => (
        <div
            style={controlPanelStyle}
        >
            <FormGroup column={true}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={layerState.show}
                            onChange={handleLayer}
                        />
                    }
                    label="Climate layer"
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={clusterState.show}
                            onChange={handleCluster}
                            color="primary"
                        />
                    }
                    label={<div style={{ display: 'flex', flexFlow: 'row' }}>
                        <Typography>Nearest places</Typography>
                        <Tooltip title="Nearest locations to you that matches the climate">
                            <InfoIcon fontSize="small" />
                        </Tooltip>
                    </div>}
                />
            </FormGroup>
            <Button onClick={clearAllLayers}>
                Clear all layers
      </Button>
        </div>
    )

    return city.show_layer ? (
        <>
            {ClimateLayer()}
            {LocationCluster()}
            {ButtonControls()}
            {
                loading ?
                    <Backdrop className={classes.backdrop} open={loading}>
                        <CircularProgress color="inherit" />
                    </Backdrop>
                    : null
            }
        </>
    ) : <></>

}
