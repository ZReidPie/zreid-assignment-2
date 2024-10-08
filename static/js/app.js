let manualCentroids = [];
let numClusters = 0;

let originalData = []; // To store the original dataset
let currentCentroids = [];
let clusterAssignments = [];
let iteration = 0;

// Undisable Buttons in JavaScript:
document.getElementById("num_clusters").addEventListener("input", function () {
	const numClusters = parseInt(document.getElementById("num_clusters").value);
	const initMethod = document.getElementById("init_method").value;

	// Enable the buttons if valid inputs are provided
	if (!isNaN(numClusters) && numClusters > 0 && initMethod) {
		document.getElementById("step_btn").classList.remove("disabled");
		document.getElementById("converge_btn").classList.remove("disabled");
		document.getElementById("step_btn").disabled = false;
		document.getElementById("converge_btn").disabled = false;

		// give it enabled color
		document.getElementById("step_btn").classList.add("enabled");
		document.getElementById("converge_btn").classList.add("enabled");
	} else {
		// take away enabled color
		document.getElementById("step_btn").classList.remove("enabled");
		document.getElementById("converge_btn").classList.remove("enabled");

		document.getElementById("step_btn").classList.add("disabled");
		document.getElementById("converge_btn").classList.add("disabled");
		document.getElementById("step_btn").disabled = true;
		document.getElementById("converge_btn").disabled = true;
	}
});

// 3 of 4 main buttons 1
document.getElementById("generate_btn").addEventListener("click", function () {
	fetch("/generate_data")
		.then((response) => response.json())
		.then((data) => {
			console.log("New dataset fetched:", data);
			originalData = data; // Store the dataset globally for future reference

			// Plotting the new dataset
			plotData(originalData);
		})
		.catch((error) => {
			console.error("Error fetching data:", error);
		});
});

// Function to reset the algorithm and replot the original data without clusters or centroids
document.getElementById("reset_btn").addEventListener("click", function () {
	console.log("Resetting algorithm...");

	// Check if the original data exists
	if (originalData && originalData.length > 0) {
		// Reset global variables for centroids, clusters, and iteration
		currentCentroids = [];
		clusterAssignments = [];
		iteration = 0;

		// Replot the original dataset without centroids or clusters
		plotData(originalData);
		alert(
			"Algorithm reset. You can select a new initialization method and try again."
		);
	} else {
		console.error("No original data found. Cannot reset.");
		alert("No dataset to reset. Please generate data first.");
	}
});

// 1
document.getElementById("converge_btn").addEventListener("click", function () {
	const initMethod = document.getElementById("init_method").value;
	const numClusters = parseInt(document.getElementById("num_clusters").value);

	if (isNaN(numClusters) || numClusters <= 0) {
		alert("Please enter a valid number of clusters.");
		return;
	}

	// Check the initialization method and ensure it's called before running KMeans
	switch (initMethod) {
		case "random":
			initializeRandom(numClusters);
			break;
		case "farthest":
			initializeFarthestFirst(numClusters);
			break;
		case "kmeans++":
			initializeKMeansPlusPlus(numClusters);
			break;
		case "manual":
			if (!manualCentroids || manualCentroids.length < numClusters) {
				alert("Please select enough centroids manually.");
				return;
			}
			currentCentroids = manualCentroids;
			break;
		default:
			alert("Please select a valid initialization method.");
			return;
	}

	// Ensure centroids are set before running KMeans
	setTimeout(function () {
		if (!currentCentroids || currentCentroids.length === 0) {
			alert(
				"Centroids not initialized. Please select an initialization method first."
			);
			return;
		}

		console.log(
			"Running KMeans to convergence with centroids:",
			currentCentroids
		);
		runKMeansToConvergence(originalData, currentCentroids);
	}, 500); // Add a small delay to ensure centroids are set correctly after initialization
});

// Function to run KMeans algorithm until convergence
function runKMeansToConvergence(data, initialCentroids) {
	if (!Array.isArray(initialCentroids) || initialCentroids.length === 0) {
		console.error("Centroids are undefined or empty. Cannot run KMeans.");
		alert(
			"Centroids not initialized. Please select a valid initialization method."
		);
		return;
	}

	let centroids = initialCentroids;
	let converged = false;
	let maxIterations = 100; // Set a limit to avoid infinite loops
	let iterationCount = 0;

	while (!converged && iterationCount < maxIterations) {
		// Step 1: Assign points to the nearest centroid
		assignPointsToClusters(data, centroids);

		// Step 2: Recalculate centroids
		const newCentroids = recalculateCentroids(
			data,
			centroids,
			clusterAssignments
		);

		// Check if centroids have converged
		converged = checkConvergence(centroids, newCentroids);

		// Update centroids for the next iteration
		centroids = newCentroids;

		iterationCount++;
	}

	// Plot the final clusters and centroids after convergence
	plotKMeansIteration(data, centroids, clusterAssignments);

	if (converged) {
		showSnackbar(); // Show snackbar notification
		alert(`KMeans converged after ${iterationCount} iterations.`);
	} else {
		alert(
			`KMeans reached max iterations (${maxIterations}) without fully converging.`
		);
	}

	console.log("KMeans algorithm finished after", iterationCount, "iterations.");
}

// Function to check if centroids have converged 1
function checkConvergence(oldCentroids, newCentroids) {
	const threshold = 0.001; // Convergence threshold (you can adjust this value)
	for (let i = 0; i < oldCentroids.length; i++) {
		const distance = Math.sqrt(
			Math.pow(oldCentroids[i][0] - newCentroids[i][0], 2) +
				Math.pow(oldCentroids[i][1] - newCentroids[i][1], 2)
		);
		if (distance > threshold) {
			return false;
		}
	}
	return true;
}

// Step THrough KMeans button and intilizes based on initMethod and Clusters
// 1
document.getElementById("step_btn").addEventListener("click", function () {
	// Get the number of clusters (k)
	const numClusters = parseInt(document.getElementById("num_clusters").value);

	// Get the initialization method
	const initMethod = document.getElementById("init_method").value;

	// Ensure valid inputs for clusters and method
	if (isNaN(numClusters) || numClusters <= 0) {
		alert("Please enter a valid number of clusters.");
		return;
	}

	// Check the initialization method and call the corresponding API or function
	switch (initMethod) {
		case "random":
			initializeRandom(numClusters);
			break;
		case "farthest":
			initializeFarthestFirst(numClusters);
			break;
		case "kmeans++":
			initializeKMeansPlusPlus(numClusters);
			break;
		case "manual":
			initializeManual(numClusters);
			break;
		default:
			alert("Please select a valid initialization method.");
			return;
	}
});

// Function to handle Random initialization
function initializeRandom(numClusters) {
	fetch("/initialize_random", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ k: numClusters }), // Send the number of clusters
	})
		.then((response) => response.json())
		.then((centroids) => {
			if (!centroids || centroids.length === 0) {
				console.error("Failed to initialize random centroids.");
				alert("Failed to initialize centroids. Please try again.");
				return;
			}
			currentCentroids = centroids; // Store centroids globally
			plotDataWithCentroids(centroids); // Plot the centroids on the visualization
			console.log("Random centroids initialized:", currentCentroids);
		})
		.catch((error) => {
			console.error("Error initializing centroids:", error);
			alert(
				"An error occurred while initializing centroids. Please try again."
			);
		});
}

// Function to handle Farthest First initialization
function initializeFarthestFirst(numClusters) {
	// Fetch farthest first centroids from the backend
	fetch("/initialize_farthest", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ k: numClusters }), // Send the number of clusters
	})
		.then((response) => response.json())
		.then((centroids) => {
			console.log("Farthest First centroids:", centroids);
			// Plot the centroids and proceed with KMeans algorithm
			plotDataWithCentroids(centroids);
			stepThroughKMeans(centroids);
		})
		.catch((error) =>
			console.error("Error initializing farthest first centroids:", error)
		);
}

// Function to handle KMeans++ initialization
function initializeKMeansPlusPlus(numClusters) {
	// Fetch KMeans++ centroids from the backend
	fetch("/initialize_kmeans_plus_plus", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ k: numClusters }), // Send the number of clusters
	})
		.then((response) => response.json())
		.then((centroids) => {
			console.log("KMeans++ centroids:", centroids);
			// Plot the centroids and proceed with KMeans algorithm
			plotDataWithCentroids(centroids);
			stepThroughKMeans(centroids);
		})
		.catch((error) =>
			console.error("Error initializing KMeans++ centroids:", error)
		);
}

// Function to handle Manual initialization (point-and-click) 1
function initializeManual(numClusters) {
	alert("Click on the plot to select " + numClusters + " centroids manually.");

	// Reset previously selected centroids
	manualCentroids = [];

	// Disable "Step Through KMeans" and "Run to Convergence" buttons during manual initialization
	document.getElementById("step_btn").classList.add("disabled");
	document.getElementById("converge_btn").classList.add("disabled");
	document.getElementById("step_btn").disabled = true;
	document.getElementById("converge_btn").disabled = true;

	// Add a click event listener to the Plotly plot
	const plotDiv = document.getElementById("kmeans_plot");

	plotDiv.on("plotly_click", function (data) {
		if (manualCentroids.length < numClusters) {
			const x = data.points[0].x;
			const y = data.points[0].y;

			// Add the clicked point as a centroid
			manualCentroids.push([x, y]);
			console.log("Selected centroid:", [x, y]);

			// Plot the manually selected centroids
			plotDataWithCentroids(manualCentroids);

			// Check if we have selected enough centroids
			if (manualCentroids.length === numClusters) {
				alert("Centroid selection complete!");

				// Enable the buttons after selecting all centroids
				document.getElementById("step_btn").classList.remove("disabled");
				document.getElementById("converge_btn").classList.remove("disabled");
				document.getElementById("step_btn").disabled = false;
				document.getElementById("converge_btn").disabled = false;

				// Optionally, store the centroids in the backend for further processing
				storeManualCentroids();
			}
		} else {
			alert("You have already selected " + numClusters + " centroids.");
		}
	});
}

// Function to plot data points and centroids
function plotDataWithCentroids(centroids) {
	// Fetch the current dataset to plot it along with the centroids
	fetch("/generate_data")
		.then((response) => response.json())
		.then((data) => {
			// Prepare data for Plotly (x and y values for the data points)
			const xValues = data.map((point) => point[0]);
			const yValues = data.map((point) => point[1]);

			// Prepare data for centroids (x and y values for the centroids)
			const centroidX = centroids.map((point) => point[0]);

			const centroidY = centroids.map((point) => point[1]);

			// Plotting the dataset
			const dataPoints = {
				x: xValues,
				y: yValues,
				mode: "markers",
				marker: { color: "blue", size: 8 }, // Customize marker appearance
			};

			// Plotting the centroids as red X's
			const centroidPoints = {
				x: centroidX,
				y: centroidY,
				mode: "markers",
				marker: {
					color: "red", // Red color for centroids
					symbol: "x", // 'x' symbol
					size: 12, // Larger size for centroids
				},
			};

			const layout = {
				title: "KMeans Clustering Data with Centroids",
				xaxis: { title: "X-axis" },
				yaxis: { title: "Y-axis" },
			};

			// Plot both the data points and centroids
			Plotly.newPlot("kmeans_plot", [dataPoints, centroidPoints], layout);
		})
		.catch((error) => console.error("Error fetching data:", error));
}

// Function to step through KMeans algorithm 1
function stepThroughKMeans(centroids) {
	if (iteration === 0) {
		// Initialize centroids and cluster assignments on the first iteration
		currentCentroids = centroids;
		clusterAssignments = new Array(currentCentroids.length)
			.fill(null)
			.map(() => []);
	}

	// Fetch the current dataset
	fetch("/generate_data")
		.then((response) => response.json())
		.then((data) => {
			// Step 1: Assign points to the nearest centroid
			assignPointsToClusters(data, currentCentroids);

			// Step 2: Recalculate centroids
			const newCentroids = recalculateCentroids(
				data,
				currentCentroids,
				clusterAssignments
			);

			// Step 3: Plot the updated centroids and clusters
			plotKMeansIteration(data, newCentroids, clusterAssignments);

			// Update current centroids for the next step
			currentCentroids = newCentroids;

			iteration++;
			console.log(`Iteration ${iteration} complete.`);
		})
		.catch((error) => console.error("Error fetching data:", error));
}

// Function to assign points to the nearest centroid 1
function assignPointsToClusters(data, centroids) {
	if (!Array.isArray(centroids) || centroids.length === 0) {
		console.error("Centroids are not defined or empty.");
		return;
	}

	clusterAssignments = new Array(centroids.length).fill(null).map(() => []);

	data.forEach((point) => {
		let nearestCentroidIndex = -1;
		let minDistance = Infinity;

		// Find the nearest centroid for this point
		centroids.forEach((centroid, index) => {
			const distance = Math.sqrt(
				Math.pow(point[0] - centroid[0], 2) +
					Math.pow(point[1] - centroid[1], 2)
			);

			if (distance < minDistance) {
				minDistance = distance;
				nearestCentroidIndex = index;
			}
		});

		// Assign the point to the nearest centroid's cluster
		if (nearestCentroidIndex !== -1) {
			clusterAssignments[nearestCentroidIndex].push(point);
		}
	});
}

// Function to recalculate centroids based on the points assigned to each cluster 1
function recalculateCentroids(data, centroids, clusterAssignments) {
	const newCentroids = [];

	clusterAssignments.forEach((cluster) => {
		if (cluster.length > 0) {
			// Calculate the mean of all points in this cluster
			const meanX =
				cluster.reduce((sum, point) => sum + point[0], 0) / cluster.length;
			const meanY =
				cluster.reduce((sum, point) => sum + point[1], 0) / cluster.length;
			newCentroids.push([meanX, meanY]);
		} else {
			// If no points are assigned to this cluster, the centroid remains the same
			newCentroids.push(centroids[clusterAssignments.indexOf(cluster)]);
		}
	});

	return newCentroids;
}

// Function to plot the current state of KMeans iteration (data points and centroids)
function plotKMeansIteration(data, centroids, clusterAssignments) {
	// Prepare data points for Plotly (x and y values, colored by cluster)
	const clusterData = clusterAssignments.map((cluster, index) => ({
		x: cluster.map((point) => point[0]),
		y: cluster.map((point) => point[1]),
		mode: "markers",
		marker: { color: getClusterColor(index), size: 8 }, // Customize marker appearance
		name: `Cluster ${index + 1}`,
	}));

	// Prepare centroids for Plotly (x and y values as red X's)
	const centroidPoints = {
		x: centroids.map((point) => point[0]),
		y: centroids.map((point) => point[1]),
		mode: "markers",
		marker: {
			color: "red", // Red color for centroids
			symbol: "x", // 'x' symbol
			size: 12, // Larger size for centroids
		},
		name: "Centroids",
	};

	const layout = {
		title: `KMeans Iteration ${iteration}`,
		xaxis: { title: "X-axis" },
		yaxis: { title: "Y-axis" },
	};

	// Plot the data points and centroids on the same plot
	Plotly.newPlot("kmeans_plot", [...clusterData, centroidPoints], layout);
}

// Helper function to get a different color for each cluster
function getClusterColor(clusterIndex) {
	const colors = [
		"blue",
		"green",
		"purple",
		"orange",
		"pink",
		"cyan",
		"yellow",
		"brown",
	];
	return colors[clusterIndex % colors.length];
}

// Function to show the snackbar for a short time 1
function showSnackbar() {
	const snackbar = document.getElementById("snackbar");
	snackbar.className = "show";
	setTimeout(function () {
		snackbar.className = snackbar.className.replace("show", "");
	}, 3000); // Show the snackbar for 3 seconds
}

// Function to plot the dataset without centroids or clusters
function plotData(data) {
	// Prepare data for Plotly (x and y values for the data points)
	const xValues = data.map((point) => point[0]);
	const yValues = data.map((point) => point[1]);

	// Plotting the dataset without centroids
	const dataPoints = {
		x: xValues,
		y: yValues,
		mode: "markers",
		marker: { color: "blue", size: 8 }, // Customize marker appearance
	};

	const layout = {
		title: "KMeans Clustering Data",
		xaxis: { title: "X-axis" },
		yaxis: { title: "Y-axis" },
	};

	// Clear the plot by replotting just the data points (no centroids or clusters)
	Plotly.newPlot("kmeans_plot", [dataPoints], layout);
}
