import { useState, useEffect } from 'react';
import apiClient from '../services/api';

const TeamProfile = ({ teamId }) => {
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const response = await apiClient.get(`teams/${teamId}`);
                setTeam(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching team:', error);
                setLoading(false);
            }
        };

        fetchTeam();
    }, [teamId]);

    if (loading) return <div>Loading...</div>;
    if (!team) return <div>Team not found</div>;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center">
                        {team.logo && (
                            <img
                                src={team.logo}
                                alt={team.name}
                                className="w-40 h-40 object-contain mr-6"
                                loading="lazy"
                                decoding="async"
                                width="160"
                                height="160"
                            />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold">{team.name}</h1>
                            <p className="text-gray-600">{team.city}</p>
                            <p className="text-gray-600">{team.conference} Conference - {team.division} Division</p>
                            <p className="text-gray-600">Established: {team.establishedYear}</p>
                            <p className="text-gray-600">Championships: {team.championships}</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-2xl font-semibold mb-4">Team Roster</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {team.roster.map((player) => (
                                <div key={player._id} className="border rounded-lg p-4">
                                    <h3 className="font-semibold">{player.name}</h3>
                                    <p className="text-gray-600">#{player.number} - {player.position}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamProfile;
