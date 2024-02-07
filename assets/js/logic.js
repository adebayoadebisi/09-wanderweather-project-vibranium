// let map;

// async function initMap() {
//   const { Map } = await google.maps.importLibrary("maps");

//   map = new Map(document.getElementById("map"), {
//     center: { lat: 52.4862, lng: -1.8904 },
//     zoom: 12,
//   });
// }

// initMap();

let map;
let places;
let infoWindow;
let markers = [];
let autocomplete;
const MARKER_PATH =
    "https://developers.google.com/maps/documentation/javascript/images/marker_green";
const hostnameRegexp = new RegExp("^https?://.+?/");
const countries = {
    au: {
        center: { lat: -25.3, lng: 133.8 },
        zoom: 4,
    },
    br: {
        center: { lat: -14.2, lng: -51.9 },
        zoom: 3,
    },
    ca: {
        center: { lat: 62, lng: -110.0 },
        zoom: 3,
    },
    fr: {
        center: { lat: 46.2, lng: 2.2 },
        zoom: 5,
    },
    de: {
        center: { lat: 51.2, lng: 10.4 },
        zoom: 5,
    },
    mx: {
        center: { lat: 23.6, lng: -102.5 },
        zoom: 4,
    },
    nz: {
        center: { lat: -40.9, lng: 174.9 },
        zoom: 5,
    },
    it: {
        center: { lat: 41.9, lng: 12.6 },
        zoom: 5,
    },
    za: {
        center: { lat: -30.6, lng: 22.9 },
        zoom: 5,
    },
    es: {
        center: { lat: 40.5, lng: -3.7 },
        zoom: 5,
    },
    pt: {
        center: { lat: 39.4, lng: -8.2 },
        zoom: 6,
    },
    us: {
        center: { lat: 37.1, lng: -95.7 },
        zoom: 3,
    },
    uk: {
        center: { lat: 54.8, lng: -4.6 },
        zoom: 5,
    },
};

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: countries["uk"].zoom,
        center: countries["uk"].center,
        mapTypeControl: false,
        panControl: false,
        zoomControl: false,
        streetViewControl: false,
    });
    infoWindow = new google.maps.InfoWindow({
        content: document.getElementById("info-content"),
    });
    // Created the autocomplete object and associate it with the UI input control.
    // Restricted the search to the default country, and to place type "cities".
    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById("autocomplete"),
        {
            types: ["(cities)"],            
            fields: ["geometry"],
        },
    );
    places = new google.maps.places.PlacesService(map);
    autocomplete.addListener("place_changed", onPlaceChanged);
    // Added a DOM event listener to react when the user selects a country.
    document
        .getElementById("country")
        .addEventListener("change", setAutocompleteCountry);
}

// When the user selects a city, get the place details for the city and
// zoom the map in on the city.
function onPlaceChanged() {
    const place = autocomplete.getPlace();

    if (place.geometry && place.geometry.location) {
        map.panTo(place.geometry.location);
        map.setZoom(15);
        search();
        getWeatherData(place.geometry.location.lat(), place.geometry.location.lng());
        // Get the element
        var weatherCard = document.getElementById('weather-cards');
        // Remove the 'hide' class
        weatherCard.classList.remove('hide');
    } else {
        document.getElementById("autocomplete").placeholder = "Enter a city";
    }
}

// Search for hotels in the selected city, within the viewport of the map.
function search() {
    const search = {
        bounds: map.getBounds(),
        types: ["lodging"],
    };

    places.nearbySearch(search, (results, status, pagination) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            clearResults();
            clearMarkers();

            // Create a marker for each hotel found, and
            // assign a letter of the alphabetic to each marker icon.
            for (let i = 0; i < results.length; i++) {
                const markerLetter = String.fromCharCode("A".charCodeAt(0) + (i % 26));
                const markerIcon = MARKER_PATH + markerLetter + ".png";

                // Use marker animation to drop the icons incrementally on the map.
                markers[i] = new google.maps.Marker({
                    position: results[i].geometry.location,
                    animation: google.maps.Animation.DROP,
                    icon: markerIcon,
                });
                // If the user clicks a hotel marker, show the details of that hotel
                // in an info window.
                //  storing on marker need to fix  that
                markers[i].placeResult = results[i];
                google.maps.event.addListener(markers[i], "click", showInfoWindow);
                setTimeout(dropMarker(i), i * 100);
                addResult(results[i], i);
            }
        }
    });
}

function clearMarkers() {
    for (let i = 0; i < markers.length; i++) {
        if (markers[i]) {
            markers[i].setMap(null);
        }
    }

    markers = [];
}

// Set the country restriction based on user input.
// Also center and zoom the map on the given country.
function setAutocompleteCountry() {
    const country = document.getElementById("country").value;

    if (country == "all") {
        autocomplete.setComponentRestrictions({ country: [] });
        map.setCenter({ lat: 15, lng: 0 });
        map.setZoom(2);
    } else {
        autocomplete.setComponentRestrictions({ country: country });
        map.setCenter(countries[country].center);
        map.setZoom(countries[country].zoom);
    }

    clearResults();
    clearMarkers();
}

function dropMarker(i) {
    return function () {
        markers[i].setMap(map);
    };
}

function addResult(result, i) {
    const results = document.getElementById("results");
    const markerLetter = String.fromCharCode("A".charCodeAt(0) + (i % 26));
    const markerIcon = MARKER_PATH + markerLetter + ".png";
    const tr = document.createElement("tr");

    tr.style.backgroundColor = i % 2 === 0 ? "#F0F0F0" : "#FFFFFF";
    tr.onclick = function () {
        google.maps.event.trigger(markers[i], "click");
    };

    const iconTd = document.createElement("td");
    const nameTd = document.createElement("td");
    const icon = document.createElement("img");

    icon.src = markerIcon;
    icon.setAttribute("class", "placeIcon");
    icon.setAttribute("className", "placeIcon");

    const name = document.createTextNode(result.name);

    iconTd.appendChild(icon);
    nameTd.appendChild(name);
    tr.appendChild(iconTd);
    tr.appendChild(nameTd);
    results.appendChild(tr);
}

function clearResults() {
    const results = document.getElementById("results");

    while (results.childNodes[0]) {
        results.removeChild(results.childNodes[0]);
    }
}

// Get the place details for a hotel. Show the information in an info window,
// anchored on the marker for the hotel that the user selected.
function showInfoWindow() {

    const marker = this;

    places.getDetails(
        { placeId: marker.placeResult.place_id },
        (place, status) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
                return;
            }

            infoWindow.open(map, marker);
            buildIWContent(place);
        },
    );
}

// Load the place information into the HTML elements used by the info window.
function buildIWContent(place) {
    document.getElementById("iw-icon").innerHTML =
        '<img class="hotelIcon" ' + 'src="' + place.icon + '"/>';
    document.getElementById("iw-url").innerHTML =
        '<b><a href="' + place.url + '">' + place.name + "</a></b>";
    document.getElementById("iw-address").textContent = place.vicinity;
    if (place.formatted_phone_number) {
        document.getElementById("iw-phone-row").style.display = "";
        document.getElementById("iw-phone").textContent =
            place.formatted_phone_number;
    } else {
        document.getElementById("iw-phone-row").style.display = "none";
    }

    // Assigned a five-star rating to the hotel, using a black star ('&#10029;')
    // to indicate the rating the hotel has earned, and a white star ('&#10025;')
    // for the rating points not achieved.
    if (place.rating) {
        let ratingHtml = "";

        for (let i = 0; i < 5; i++) {
            if (place.rating < i + 0.5) {
                ratingHtml += "&#10025;";
            } else {
                ratingHtml += "&#10029;";
            }

            document.getElementById("iw-rating-row").style.display = "";
            document.getElementById("iw-rating").innerHTML = ratingHtml;
        }
    } else {
        document.getElementById("iw-rating-row").style.display = "none";
    }

    // The regexp isolates the first part of the URL (domain plus subdomain)
    // to give a short URL for displaying in the info window.
    if (place.website) {
        let fullUrl = place.website;
        let website = String(hostnameRegexp.exec(place.website));

        if (!website) {
            website = "http://" + place.website + "/";
            fullUrl = website;
        }

        document.getElementById("iw-website-row").style.display = "";
        document.getElementById("iw-website").textContent = website;
    } else {
        document.getElementById("iw-website-row").style.display = "none";
    }
}

window.initMap = initMap;



function getWeatherData(lat, lon) {
    const apiKey = '6e6ade96d8095c12cd33b0c0c68d88b0';
    const forecastURL = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    fetch(forecastURL)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(function (forecastData) {
            if (!forecastData) {
                console.error('No forecast data from API');
                return;
            }


            // Get the current weather data
            let currentIcon = forecastData.current.weather[0].icon;
            const currentIconURL = "http://openweathermap.org/img/wn/" + currentIcon + ".png";
            console.log(currentIconURL);
            let currentWeather = forecastData.current.weather[0].main + " - " + forecastData.current.weather[0].description;
            let currentTemp = forecastData.current.temp;
            let currentFeelsLike = forecastData.current.feels_like;
            let currentHumidity = forecastData.current.humidity;
            let currentTempC = Math.trunc(currentTemp - 273.15)
            let currentFeelsLikeC = Math.trunc(currentFeelsLike - 273.15)

            // id's for current weather

            let day1 = document.getElementById("day-1");
            let day1temp = document.getElementById("today-temp");
            let day1weather = document.getElementById("today-weather");
            let day1feelsLike = document.getElementById("today-feels-like");
            let day1humidity = document.getElementById("today-humidity");

            let tomorrow = forecastData.daily[1];
            let dayAfterTomorrow = forecastData.daily[2];
            let dayThree = forecastData.daily[3];
            let dayFour = forecastData.daily[4];

            // variables for tomorrow's weather
            let tomorrowIcon = tomorrow.weather[0].icon;
            const tomorrowIconURL = "http://openweathermap.org/img/wn/" + tomorrowIcon + ".png";
            let tomorrowWeather = tomorrow.weather[0].main + " - " + tomorrow.weather[0].description;
            let tomorrowDate = tomorrow.dt;
            let tomorrowTemp = tomorrow.temp.day;
            let tomorrowFeelsLike = tomorrow.feels_like.day;
            let tomorrowHumidity = tomorrow.humidity;
            let tomorrowTempC = Math.trunc(tomorrowTemp - 273.15)
            let tomorrowFeelsLikeC = Math.trunc(tomorrowFeelsLike - 273.15)

            // id's for tomorrow's weather

            let dayTwoTemp = document.getElementById("tomorrow-temp");
            let dayTwoDate = document.getElementById("tomorrow-date");
            let dayTwoWeather = document.getElementById("tomorrow-weather");
            let dayTwoFeelsLike = document.getElementById("tomorrow-feels-like");
            let dayTwoHumidity = document.getElementById("tomorrow-humidity");

            // variables for the day after tomorrow's weather
            let dayAfterIcon = dayAfterTomorrow.weather[0].icon;
            const dayAfterIconURL = "http://openweathermap.org/img/wn/" + dayAfterIcon + ".png";
            let dayAfterWeather = dayAfterTomorrow.weather[0].main + " - " + dayAfterTomorrow.weather[0].description;
            let dayAfterDate = dayAfterTomorrow.dt;
            let dayAfterTemp = dayAfterTomorrow.temp.day;
            let dayAfterFeelsLike = dayAfterTomorrow.feels_like.day;
            let dayAfterHumidity = dayAfterTomorrow.humidity;
            let dayAfterTempC = Math.trunc(dayAfterTemp - 273.15)
            let dayAfterFeelsLikeC = Math.trunc(dayAfterFeelsLike - 273.15)


            // id's for the day after tomorrow's weather

            let dayThreeTemp = document.getElementById("third-temp");
            let dayThreeDate = document.getElementById("third-date");
            let dayThreeWeather = document.getElementById("third-weather");
            let dayThreeFeelsLike = document.getElementById("third-feels-like");
            let dayThreeHumidity = document.getElementById("third-humidity");

            // variables for the fourth day's weather
            let dayFourIcon = dayThree.weather[0].icon;
            const dayFourIconURL = "http://openweathermap.org/img/wn/" + dayFourIcon + ".png";
            let dayFourWeather = dayThree.weather[0].main + " - " + dayThree.weather[0].description;
            let dayFourDate = dayThree.dt;
            let dayFourTemp = dayThree.temp.day;
            let dayFourFeelsLike = dayThree.feels_like.day;
            let dayFourHumidity = dayThree.humidity;
            let dayFourTempC = Math.trunc(dayFourTemp - 273.15)
            let dayFourFeelsLikeC = Math.trunc(dayFourFeelsLike - 273.15)

            // id's for the fourth day's weather
            let FourthDayTemp = document.getElementById("fourth-temp");
            let FourthDayDate = document.getElementById("fourth-date");
            let FourthDayWeather = document.getElementById("fourth-weather");
            let FourthDayFeelsLike = document.getElementById("fourth-feels-like");
            let FourthDayHumidity = document.getElementById("fourth-humidity");

            //variables for the fifth day's weather
            let dayFiveIcon = forecastData.daily[4].weather[0].icon;
            const dayFiveIconURL = "http://openweathermap.org/img/wn/" + dayFiveIcon + ".png";
            let dayFiveWeather = forecastData.daily[4].weather[0].main + " - " + forecastData.daily[4].weather[0].description;
            let dayFiveDate = forecastData.daily[4].dt;
            let dayFiveTemp = forecastData.daily[4].temp.day;
            let dayFiveFeelsLike = forecastData.daily[4].feels_like.day;
            let dayFiveHumidity = forecastData.daily[4].humidity;
            let dayFiveTempC = Math.trunc(dayFiveTemp - 273.15)
            let dayFiveFeelsLikeC = Math.trunc(dayFiveFeelsLike - 273.15)

            // id's for the fifth day's weather
            let FifthDayTemp = document.getElementById("fifth-temp");
            let FifthDayDate = document.getElementById("fifth-date");
            let FifthDayWeather = document.getElementById("fifth-weather");
            let FifthDayFeelsLike = document.getElementById("fifth-feels-like");
            let FifthDayHumidity = document.getElementById("fifth-humidity");


            // variables for the next five days weather
            nextFiveDays = forecastData.daily.slice(1, 6);
            nextFiveDays.forEach(day => {
                console.log(day);

                // Function to format the date as "DDD dd mm yyyy"
                function formatDate(timestamp) {
                    var date = new Date(timestamp * 1000);

                    // Get day of the week (DDD)
                    var daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    var dayOfWeek = daysOfWeek[date.getDay()];

                    // Get day of the month (dd)
                    var dayOfMonth = date.getDate();

                    // Get month (mm)
                    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    var month = monthNames[date.getMonth()];

                    // Get year (yyyy)
                    var year = date.getFullYear();

                    // Format the date as "DDD dd mm yyyy" and return
                    return `${dayOfWeek} ${dayOfMonth} ${month} ${year}`;
                }

                var formattedDate = formatDate(day.dt);

                // Usage example:
                console.log(formatDate(1612306600)); // Output: "Thu 04 Feb 2021"

                //append the current weather data to the page
                document.getElementById("today-icon").src = currentIconURL;
                day1weather.innerHTML = `Weather: ${currentWeather}`;
                day1temp.innerHTML = `Temperature: ${currentTempC}°C`;
                day1feelsLike.innerHTML = `Feels Like: ${currentFeelsLikeC}°C`;
                day1humidity.innerHTML = `Humidity: ${currentHumidity}%`;

                //append the next five days weather data to the page
                //tomorrow
                document.getElementById("tomorrow-icon").src = tomorrowIconURL;
                dayTwoDate.innerHTML = `Date: ${formatDate(tomorrowDate)}`;
                dayTwoWeather.innerHTML = `Weather: ${tomorrowWeather}`;
                dayTwoTemp.innerHTML = `Temperature: ${tomorrowTempC}°C`;
                dayTwoFeelsLike.innerHTML = `Feels Like: ${tomorrowFeelsLikeC}°C`;
                dayTwoHumidity.innerHTML = `Humidity: ${tomorrowHumidity}%`;

                //day after tomorrow
                document.getElementById("third-icon").src = dayAfterIconURL;
                dayThreeDate.innerHTML = `Date: ${formatDate(dayAfterDate)}`;
                dayThreeWeather.innerHTML = `Weather: ${dayAfterWeather}`;
                dayThreeTemp.innerHTML = `Temperature: ${dayAfterTempC}°C`;
                dayThreeFeelsLike.innerHTML = `Feels Like: ${dayAfterFeelsLikeC}°C`;
                dayThreeHumidity.innerHTML = `Humidity: ${dayAfterHumidity}%`;

                //fourth day
                document.getElementById("fourth-icon").src = dayFourIconURL;
                FourthDayDate.innerHTML = `Date: ${formatDate(dayFourDate)}`;
                FourthDayWeather.innerHTML = `Weather: ${dayFourWeather}`;
                FourthDayTemp.innerHTML = `Temperature: ${dayFourTempC}°C`;
                FourthDayFeelsLike.innerHTML = `Feels Like: ${dayFourFeelsLikeC}°C`;
                FourthDayHumidity.innerHTML = `Humidity: ${dayFourHumidity}%`;

                //fifth day
                document.getElementById("fifth-icon").src = dayFiveIconURL;
                FifthDayDate.innerHTML = `Date: ${formatDate(dayFiveDate)}`;
                FifthDayWeather.innerHTML = `Weather: ${dayFiveWeather}`;
                FifthDayTemp.innerHTML = `Temperature: ${dayFiveTempC}°C`;
                FifthDayFeelsLike.innerHTML = `Feels Like: ${dayFiveFeelsLikeC}°C`;
                FifthDayHumidity.innerHTML = `Humidity: ${dayFiveHumidity}%`;

            });
        });
};