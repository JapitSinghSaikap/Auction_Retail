import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_ITEMS } from '../graphql/queries';
import CountdownTimer from './CountdownTimer';
import { resolveImageUrl } from '../utils/imageUrl';

export default function AuctionsEndingSoon() {
  const navigate = useNavigate();
  const { data } = useQuery(GET_ITEMS, {
    variables: { status: 'active' },
    pollInterval: 60000,
  });

  const now          = Date.now();
  const twoHours     = 2 * 60 * 60 * 1000;
  const endingSoon   = (data?.getItems || [])
    .filter((i) => {
      const end = new Date(i.endTime).getTime();
      return end > now && end - now <= twoHours;
    })
    .sort((a, b) => new Date(a.endTime) - new Date(b.endTime))
    .slice(0, 4);

  if (endingSoon.length === 0) return null;

  return (
    <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.08)]
                    shadow-[0_1px_4px_rgba(26,24,37,0.06)] overflow-hidden mt-4">
      <div className="px-4 py-3 border-b border-[rgba(26,24,37,0.07)]">
        <div className="flex items-center gap-2">
          <span className="text-[13px]">⏱️</span>
          <span className="text-[13px] font-bold text-primary">Ending Soon</span>
          <span className="text-[10px] font-semibold text-live-red bg-[rgba(232,52,28,0.08)]
                           px-1.5 py-0.5 rounded-full border border-[rgba(232,52,28,0.15)]">
            {endingSoon.length}
          </span>
        </div>
      </div>

      <div>
        {endingSoon.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(`/auction/${item.id}`)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left
                       border-b border-[rgba(26,24,37,0.05)] last:border-0
                       hover:bg-[rgba(26,24,37,0.02)] transition-colors"
          >
            <div className="w-9 h-9 rounded-[7px] overflow-hidden bg-[#1a1825] shrink-0">
              <img
                src={resolveImageUrl(item.image, item.title)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-primary truncate">{item.title}</p>
              <div className="mt-0.5">
                <CountdownTimer endTime={item.endTime} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
