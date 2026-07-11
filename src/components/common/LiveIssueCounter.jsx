import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const LiveIssueCounter = () => {
  const [activeIssues, setActiveIssues] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'assigned', 'in-progress']);

      setActiveIssues(count || 0);
    };

    fetchCount();

    const channel = supabase
      .channel('live-issue-counter')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl font-bold">
      <i className="fas fa-circle text-red-500 text-xs mr-1 animate-pulse"></i>
      {activeIssues} Active Issues Now
    </div>
  );
};

export default LiveIssueCounter;
