$(() => {
	$(".hidden-stats").addClass("d-none");

	if (getUrlParameter("uuid") != null) {
		display(getUrlParameter("uuid"));
	}

	$("#search").on("click", () => search($("#ign").val()));

	$("#ign").keyup((e) => {
		if (e.keyCode == 13) {
			$("#search").click();
		}
	});
});

function search(ign) {
	console.log("Searching for user " + ign);
	$.getJSON(Config.MojangAPIProxy + "username_to_uuid/" + ign, (data) => {
		display(data.uuid);
		setUrlParameter("uuid", data.uuid);
	}).fail(function (e) {
		if (e.status == 404) {
			toastr.error("Could not find player")
		} else if (e.status == 400) {
			toastr.error("Invalid username")
		} else {
			toastr.error("Failed to fetch data from " + Config.MojangAPIProxy)
		}
	});
}

function display(uuid) {
	$.getJSON(Config.MojangAPIProxy + "profile/" + uuid, (profileData) => {

		console.log(profileData);

		toastr.info("Fetching tournament data...")
		$.getJSON(Config.TournamentStatsURL, (tournamentData) => {
			$(".hidden-stats").removeClass("d-none");

			$(".username").text(profileData.name);
			$("#ign").val(profileData.name);
			$("#player_head").attr("src", Config.SkullProvider + uuid);

			let participatedIn = tournamentData.filter((e) => e.players.some(p => p.uuid == uuid));

			let scoreSum = 0;
			let killSum = 0;
			let winSum = 0;
			let combinedTeamScore = 0;
			let scoreTopTimes = 0;

			let tournaments = [];

			let teammates = [];

			participatedIn.forEach(tournament => {
				let topPlayer = tournament.players.sort((a, b) => b.score - a.score)[0];
				let player = tournament.players.find(p => p.uuid == uuid);
				let team = tournament.teams.find(t => t.team_number == player.team_number);

				let teamedWith = tournament.players.filter(p => p.uid != player.uid).filter(p => p.team_number == player.team_number);
				let teamedWithIGN = [];

				teamedWith.forEach(tp => {
					if (!teammates.some(t => t.uuid == tp.uuid)) {
						teammates.push({
							uuid: tp.uuid,
							name: tp.username
						});
					}

					teamedWithIGN.push(tp.username);
				});

				let isWinner = false;

				if (player.team_number == tournament.winner_team_id) {
					winSum++;
					isWinner = true;
				}

				if (topPlayer.uid == player.uid) {
					scoreTopTimes++;
				}

				combinedTeamScore += team.team_score;

				scoreSum += player.score;
				killSum += player.kills;
				console.log("------------");
				console.log("Top player:");
				console.log(topPlayer);
				console.log("Player:");
				console.log(player);
				console.log("Team:");
				console.log(team);
				console.log("Torurnament:");
				console.log(tournament);
				console.log("Teamed with:");
				console.log(teamedWith);

				tournaments.push({
					name: tournament.display_name,
					is_winner: isWinner,
					score: player.score,
					kills: player.kills,
					team_score: team.team_score,
					teamed_with_igns: teamedWithIGN
				});
			});

			console.log(tournaments);


			$("#tournaments").html("");
			$("#teammates").html("");

			tournaments.forEach(t => {
				console.log(t);

				let element = $("<tr></tr>");

				element.addClass(t.is_winner ? "table-success" : "table-danger");

				element.append($("<td></td>").text(t.name));
				element.append($("<td></td>").text(t.is_winner ? "Yes" : "No"));
				element.append($("<td></td>").text(t.score));
				element.append($("<td></td>").text(t.kills));
				element.append($("<td></td>").text(t.team_score));
				element.append($("<td></td>").text(t.teamed_with_igns.join(", ")));

				$("#tournaments").append(element)
			});

			teammates.forEach(teammate => {
				let element = $("#teammate_template").clone();

				element.removeAttr("id");

				element.find(".card-img-top").attr("src", Config.SkullProvider + teammate.uuid);
				element.find(".card-title").text(teammate.name);

				element.find(".show-teammate-stats").attr("data-uuid", teammate.uuid);
				element.find(".show-teammate-stats").on("click", function () {
					let uuid = $(this).data("uuid");
					console.log("Navigating to " + uuid);
					setUrlParameter("uuid", uuid);
					window.location.reload();
				})

				$.getJSON(Config.MojangAPIProxy + "profile/" + teammate.uuid, (data) => {
					element.find(".card-title").text(data.name);
				})

				$("#teammates").append(element);
			});

			var summary = profileData.name + " has participated in " + participatedIn.length + " tournaments and ";
			summary += "their team have won " + winSum + " times, their total score is " + scoreSum + " and their total kill count is " + killSum + ". ";
			summary += "They have placed top individual " + scoreTopTimes + " times. The total score their team has collected is " + combinedTeamScore + ".";
			$("#tournament_summary").text(summary);

			toastr.success("Stats fetched successfully");
		}).fail(function (e) {
			toastr.error("Failed to fetch tournament data. Response code: " + e.status);
		});

	}).fail(function (e) {
		if (e.status == 404) {
			toastr.error("Could not find player");
		} else {
			toastr.error("Failed to fetch data from " + Config.MojangAPIProxy);
		}
	});
}