---
templateKey: "blog-post"
title: "Ring Buffer에 대해"
description: "Ring Buffer에 대한 소개, 장점, 사용 시례 등을 정리함."
author: "미물"
authorURL: "https://mimul.com"
date: "2021-12-14T21:12:16.000Z"
lastModificationTime: "2021-12-14T21:30:01.000Z"
image: "/img/blog/ring_buffer_title.webp"
commentId: "ring-buffer-2021-12-14"
tags:
  - Ring Buffer
  - Circular Buffer
---
MQTT 기반 푸시 시스템을 만들면서 토픽별로 수신된 메세지를 해당 토픽을 구독한 클라이언트가 연결이 끊겼을 때 나중에 접속할 때 재전송을 위해 링 버퍼를 사용했었는데, 이때의 성능 개선 경험이 생각나서, 그 당시 리서치한 내용을 포함해 링 버퍼에 대한 전반적인 내용을 정리해 본다.

#### 개요

링 버퍼는 기능적으로는 First In First Out(FIFO)라고도 불리는 큐의 일종이지만 아래 그림처럼 먼저 온 손님이 자리가 비면 먼저 호출되어 자리로 가고 큐에서는 지워지고, 나중에 온 손님은 번호표 받듯이 대기열에 추가된다. 이렇게 다음 고객이 계속 늘어나면 영역이 유한한 컴퓨팅 자원 상 대기 영역이 고갈되는 문제가 발생하는데 이를 빈 영역을 재사용하는 방법으로 링 버퍼라는 구조가 생겨났다. 즉, 링 버퍼에서는 데이터의 번호가 최대일 때, 최소의 번호가 비어 있는 경우는 다음의 데이터 저장 장소로서 덮어쓰기로 재사용된다. 그리고 큐 안에 데이터가 채워져 새로운 데이터를 저장할 수 없는 경우, 큐의 앞의 시스템이 대기가 발생해 늦어지거나, 처리 순서가 이상하게 되어 버리거나 하기 때문에, 큐의 처리 속도를 고려해 필요한만큼 깊은(긴) 큐를 설계해 둘 필요가 있다.

![Rinng Buffer](/img/blog/ring_buffer.png)

#### 링 버퍼 장점

- High Performance : 링 버퍼의 enqueue와 dequeue 시간복잡도는 O(1)이다
- Memory Efficiency : 미리 고정 크기의 메모리를 할당하기에 메모리 오버헤드를 피할 수 있다.

#### 링 버퍼 사용처

- Real-time Data Acquisition and Processing : 최신 데이터를 중요시하는 센서 데이터 저장시에 사용되고, 오디오/비디오 처리에서는 오디오/비디오의 프레임을 버퍼링해서 끊김을 방지할 때 사용됨.
- Communication and Inter-process Communication (IPC) : 송/수신 데이터 속도가 다른 수/발신 네트워크 데이터를 관리할 때 사용되고, 서로 다른 프로세스나 스레드간 통신을 원활하게 하기 위해 메세지 큐에서 사용됨.
- Embedded Systems : 메모리 사용량이 제한되는 특성이 있어 마이크로컨트롤러와 주변 장치 간에 교환되는 데이터를 버퍼링할 때 사용됨.
- System Monitoring and Performance Analysis : CPU 사용량이나 네트워크 트래픽과 같은 성능 지표 기록할 때 사용되고, 디버깅 목적으로 시스템 호출 또는 실행 추적 내용을 저장함.
- Undo/Redo Functionality (with careful implementation) : 실패한 잡을 재실행하거나 비동기 실행 잡을 관리할 때 사용됨.
- Data Streaming and Logging : 처리량이 높은 로깅 시나리오에서 파일에 기록하거나 네트워크를 통해 전송하기 전에 로그 메시지를 일시적으로 저장할 때 사용됨.

#### 링 버퍼 구현 예

구현 소스는 [Gitbub](https://github.com/mimul/algorithm/blob/master/cpp/ring-buffer/ring_buffer.cpp)에서도 볼 수 있다. 구현 내용은 enqueue/dequeue 함수를 보면 되는데 enqueue는 순환큐에 넣는 함수이고, dequeue는 빼는 함수로 구성되어 있다. 생성자 안에서 배열(buffer_)을 하나 준비하고, read_idx_와 write_idx_가 그 위를 빙글빙글 돌아가면서 처리하는 구조이다.

```
#include <atomic>
#include <chrono>
#include <cstddef>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <mutex>
#include <queue>
#include <thread>
#include <vector>

class RingBuffer {
public:
  explicit RingBuffer(size_t size) : buffer_(size) {}

  // Returns true on success. Fails if the buffer is full.
  bool enqueue(int item) {
    uint64_t write_idx = write_idx_.load(std::memory_order_relaxed);
    if (write_idx - cached_read_idx_ == buffer_.size()) {
      cached_read_idx_ = read_idx_.load(std::memory_order_acquire);
      if (write_idx - cached_read_idx_ == buffer_.size()) {
        return false;
      }
    }
    buffer_[write_idx & (buffer_.size() - 1)] = item;
    write_idx_.store(write_idx + 1, std::memory_order_release);
    return true;
  }

  // Returns true on success. Fails if the buffer is empty.
  bool dequeue(int *dest) {
    uint64_t read_idx = read_idx_.load(std::memory_order_relaxed);
    if (cached_write_idx_ == read_idx) {
      cached_write_idx_ = write_idx_.load(std::memory_order_acquire);
      if (cached_write_idx_ == read_idx) {
        return false;
      }
    }
    *dest = buffer_[read_idx & (buffer_.size() - 1)];
    read_idx_.store(read_idx + 1, std::memory_order_release);
    return true;
  }

private:
  std::vector<int> buffer_;
  alignas(64) std::atomic<uint64_t> read_idx_{0};
  alignas(64) uint64_t cached_read_idx_{0};
  alignas(64) std::atomic<uint64_t> write_idx_{0};
  alignas(64) uint64_t cached_write_idx_{0};
};

constexpr uint64_t bmtCount = 500000;

template <typename RingBufferType> double benchmark(RingBufferType &rb) {
  auto start = std::chrono::system_clock::now();
  std::thread workers[2] = {
      std::thread([&]() {
        for (uint64_t i = 0; i < bmtCount; ++i) {
          int count = 1000;
          while (0 < count) {
            if (rb.enqueue(count)) {
              count--;
            }
          }
        }
      }),
      std::thread([&]() {
        int result;
        for (uint64_t i = 0; i < bmtCount; ++i) {
          int count = 1000;
          while (0 < count) {
            if (rb.dequeue(&result)) {
              count--;
            }
          }
        }
      })};
  for (auto &w : workers) {
    w.join();
  }
  auto end = std::chrono::system_clock::now();
  double duration = std::chrono::duration_cast<std::chrono::nanoseconds>(end - start).count();
  const int count = bmtCount * (1000 + 1000);
  std::cerr << count << " ops in " << duration << " ns \t";
  return 1000000.0 * bmtCount * (1000 + 1000) / duration;
}

int main() {
  RingBuffer rb(2 * 1024 * 1024);
  std::cout << "RingBuffer: " << benchmark(rb) << " ops/ms\n";
};
```

이 소스를 실행햐면 아래와 같이 1,095,400 ops/ms가 나온다. cached_read_idx_, cached_write_idx_ 에서 캐시 기능을 붙여 성능이 더 올라갔다.

```
> g++ -Wall -O3 -march=native -std=c++17 ring_buffer.cpp
> ./ring_buffer
RingBuffer: 1000000000 ops in 912,909,000 ns  1,095,400 ops/ms
```

#### 링 버퍼 구현한 오픈 소스 구현체

- [LMAX Disruptor](https://github.com/LMAX-Exchange/disruptor) : 성능 메시징 프레임워크로, 락(lock)을 사용하지 않는 링 버퍼를 활용하여 스레드 간의 데이터 교환을 매우 빠르게 처리함.
- [Redisson](https://redisson.pro/blog/redis-based-ring-buffer-for-java.html) : Redis 자바 클라이언트로, RRingBuffer 인터페이스를 통해 링 버퍼 데이터 구조를 지원.
- [Apache Commons Collections](https://commons.apache.org/proper/commons-collections/javadocs/api-3.2.2/org/apache/commons/collections/buffer/CircularFifoBuffer.html) : Java용 라이브러리로, CircularFifoBuffer라는 링 버퍼 구현체를 포함하고 있음.


#### 참조 사이트
- [Circular buffer](https://en.wikipedia.org/wiki/Circular_buffer)
- [Optimizing a ring buffer for throughput](https://rigtorp.se/ringbuffer/)