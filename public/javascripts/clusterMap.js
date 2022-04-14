mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
container: 'cluster-map',
style: 'mapbox://styles/mapbox/dark-v10',
center: [78.9629, 20.5937],
zoom: 3.2
});

map.addControl(new mapboxgl.NavigationControl());

map.on('load', () => {

map.addSource('restaurants', {
type: 'geojson',
data: restaurants,
cluster: true,
clusterMaxZoom: 14,
clusterRadius: 50
});
 
map.addLayer({
id: 'clusters',
type: 'circle',
source: 'restaurants',
filter: ['has', 'point_count'],
paint: {

'circle-color': [
'step',
['get', 'point_count'],
'#00BCD4',
10,
'#2196F3',
30,
'#3F51B5'
],
'circle-radius': [
'step',
['get', 'point_count'],
15,
10,
20,
30,
25
]
}
});
 
map.addLayer({
id: 'cluster-count',
type: 'symbol',
source: 'restaurants',
filter: ['has', 'point_count'],
layout: {
'text-field': '{point_count_abbreviated}',
'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
'text-size': 12
}
});
 
map.addLayer({
id: 'unclustered-point',
type: 'circle',
source: 'restaurants',
filter: ['!', ['has', 'point_count']],
paint: {
'circle-color': '#11b4da',
'circle-radius': 4,
'circle-stroke-width': 1,
'circle-stroke-color': '#fff'
}
});
 
// inspect a cluster on click
map.on('click', 'clusters', (e) => {
const features = map.queryRenderedFeatures(e.point, {
layers: ['clusters']
});
const clusterId = features[0].properties.cluster_id;
map.getSource('restaurants').getClusterExpansionZoom(
clusterId,
(err, zoom) => {
if (err) return;
 
map.easeTo({
center: features[0].geometry.coordinates,
zoom: zoom
});
}
);
});
 
// When a click event occurs on a feature in
// the unclustered-point layer, open a popup at
// the location of the feature, with
// description HTML from its properties.
map.on('click', 'unclustered-point', (e) => {
const {popUpMarkup} = e.features[0].properties;

const coordinates = e.features[0].geometry.coordinates.slice();

// Ensure that if the map is zoomed out such that
// multiple copies of the feature are visible, the
// popup appears over the copy being pointed to.
while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
}
 
new mapboxgl.Popup()
.setLngLat(coordinates)
.setHTML(
popUpMarkup
)
.addTo(map);
});
 
map.on('mouseenter', 'clusters', () => {
map.getCanvas().style.cursor = 'pointer';
});
map.on('mouseleave', 'clusters', () => {
map.getCanvas().style.cursor = '';
});
});   

