import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
        <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
    </svg>
);

const HomePage = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const featuredPlayers = [
        { id: 1, name: 'James Harden', team: 'Brooklyn Nets', image: 'https://cdn.usegalileo.ai/sdxl10/f8932245-d5e1-4bb2-abc3-7d7d9f19ba5a.png' },
        { id: 2, name: 'Kyrie Irving', team: 'Brooklyn Nets', image: 'https://cdn.usegalileo.ai/sdxl10/5fc51668-f1c0-4436-aa58-ec0e57730975.png' },
        { id: 3, name: 'Kevin Durant', team: 'Brooklyn Nets', image: 'https://cdn.usegalileo.ai/sdxl10/372f086e-46b4-49e1-8edb-ccb8e08bce44.png' },
        { id: 4, name: 'Stephen Curry', team: 'Golden State Warriors', image: 'https://cdn.usegalileo.ai/sdxl10/021d44ef-3dad-42fc-9086-841e23e822f7.png' },
        { id: 5, name: 'LeBron James', team: 'Los Angeles Lakers', image: 'https://cdn.usegalileo.ai/sdxl10/b4623159-03f7-4101-a9de-761d1683c1ac.png' },
        { id: 6, name: 'Anthony Davis', team: 'Los Angeles Lakers', image: 'https://cdn.usegalileo.ai/sdxl10/3c1bcead-7a13-4819-9afb-8607e382f97c.png' },
    ];

    const exploreItems = [
        { id: 1, name: 'Players', image: 'https://cdn.usegalileo.ai/sdxl10/b7cdfca4-87b2-479d-bf45-87b0ab30a698.png' },
        { id: 2, name: 'Teams', image: 'https://cdn.usegalileo.ai/sdxl10/38350b72-a66c-41bb-b4cd-1fd5f3817baf.png' },
        { id: 3, name: 'Predictions', image: 'https://cdn.usegalileo.ai/sdxl10/77bca84f-5e20-40b0-b075-bc859d47eae1.png' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            window.location.href = `/stats?player=${encodeURIComponent(searchTerm)}`;
        }
    };

    return (
        <div className="px-40 flex flex-1 justify-center py-5 bg-black min-h-screen">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
                <div className="@container">
                    <div className="@[480px]:p-4">
                        <div
                            className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-xl items-start justify-end px-4 pb-10 @[480px]:px-10"
                            style={{
                                backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://cdn.usegalileo.ai/sdxl10/26209e49-8f36-4da5-9485-e0f54a6f05c3.png")'
                            }}
                        >
                            <div className="flex flex-col gap-2 text-left">
                                <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-5xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em]">
                                    Welcome to NBA Insight Lab
                                </h1>
                                <h2 className="text-white text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal">
                                    We help you make smarter decisions. Explore player stats and predictions
                                </h2>
                            </div>
                            <form onSubmit={handleSubmit} className="w-full max-w-[480px]">
                                <label className="flex flex-col min-w-40 h-14 w-full @[480px]:h-16">
                                    <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                                        <div className="text-[#90abcb] flex border border-[#314b68] bg-[#182534] items-center justify-center pl-[15px] rounded-l-xl border-r-0">
                                            <SearchIcon />
                                        </div>
                                        <input
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search a player or team"
                                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#314b68] bg-[#182534] focus:border-[#314b68] h-full placeholder:text-[#90abcb] px-[15px] rounded-r-none border-r-0 pr-2 rounded-l-none border-l-0 pl-2 text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal"
                                        />
                                        <div className="flex items-center justify-center rounded-r-xl border-l-0 border border-[#314b68] bg-[#182534] pr-[7px]">
                                            <button
                                                type="submit"
                                                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-[#1c80f2] text-white text-sm font-bold leading-normal tracking-[0.015em] @[480px]:text-base @[480px]:font-bold @[480px]:leading-normal @[480px]:tracking-[0.015em]"
                                            >
                                                <span className="truncate">Submit</span>
                                            </button>
                                        </div>
                                    </div>
                                </label>
                            </form>
                        </div>
                    </div>
                </div>

                <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Featured</h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
                    {featuredPlayers.map((player) => (
                        <div key={player.id} className="flex flex-col gap-3 pb-3">
                            <div
                                className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl"
                                style={{ backgroundImage: `url("${player.image}")` }}
                            />
                            <div>
                                <p className="text-white text-base font-medium leading-normal">{player.name}</p>
                                <p className="text-[#90abcb] text-sm font-normal leading-normal">{player.team}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Explore</h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
                    {exploreItems.map((item) => (
                        <div key={item.id} className="flex flex-col gap-3 pb-3">
                            <div
                                className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl"
                                style={{ backgroundImage: `url("${item.image}")` }}
                            />
                            <p className="text-white text-base font-medium leading-normal">{item.name}</p>
                        </div>
                    ))}
                </div>

                <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Latest Insights</h2>
                <div className="p-4">
                    <div className="flex items-stretch justify-between gap-4 rounded-xl">
                        <div className="flex flex-[2_2_0px] flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <p className="text-[#90abcb] text-sm font-normal leading-normal">Predictions</p>
                                <p className="text-white text-base font-bold leading-tight">Who will be the 2022 NBA MVP?</p>
                                <p className="text-[#90abcb] text-sm font-normal leading-normal">
                                    Our model predicts that Stephen Curry has the highest chance of winning the 2022 MVP award
                                </p>
                            </div>
                            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 flex-row-reverse bg-[#223449] text-white text-sm font-medium leading-normal w-fit">
                                <span className="truncate">View Predictions</span>
                            </button>
                        </div>
                        <div
                            className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex-1"
                            style={{ backgroundImage: 'url("https://cdn.usegalileo.ai/sdxl10/329d4fea-2464-43fb-95a7-8986165c27a7.png")' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;