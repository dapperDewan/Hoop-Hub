import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../services/api';

const PlayerProfile = () => {
    const { id } = useParams();
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlayer = async () => {
            try {
                const response = await apiClient.get(`players/${id}`);
                setPlayer(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching player:', error);
                setLoading(false);
            }
        };
        fetchPlayer();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (!player) return <div>Player not found</div>;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center">
                        {player.image && (
                            <img
                                src={player.image}
                                alt={player.name}
                                className="w-32 h-32 rounded-full object-cover mr-6"
                                loading="lazy"
                                decoding="async"
                                width="128"
                                height="128"
                            />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold">{player.name}</h1>
                            <p className="text-gray-600">{player.team}</p>
                            <p className="text-gray-600">#{player.number} | {player.position}</p>
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-3">Player Stats</h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{player.stats?.pointsPerGame}</p>
                                <p className="text-gray-600">PPG</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold">{player.stats?.assistsPerGame}</p>
                                <p className="text-gray-600">APG</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold">{player.stats?.reboundsPerGame}</p>
                                <p className="text-gray-600">RPG</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-3">Player Info</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-600">Height: {player.height}</p>
                                <p className="text-gray-600">Weight: {player.weight}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Age: {player.age}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerProfile;
