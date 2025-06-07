import { useQuery } from '@apollo/client';
import { QUERY_YAPPERS } from '../utils/queries';
import SplashScreen from '../components/SplashScreen';

const Home = () => {
  const { loading, data } = useQuery(QUERY_YAPPERS);
  const yappers = data?.yappers || [];

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <main>
      <div>
        <div>
          <h3>There are {yappers.length} users.</h3>
        </div>
      </div>
    </main>
  );
};

export default Home;
