# ロジック層（src/core）のユニットテストをホスト PC 上でビルド・実行する
# 使い方: make -C m5-recorder/test

CXX ?= g++
CXXFLAGS ?= -std=c++17 -Wall -Wextra -Werror -O0 -g
CORE_DIR := ../src/core
BUILD_DIR := build

CORE_SRCS := $(wildcard $(CORE_DIR)/*.cpp)
TEST_SRCS := $(wildcard *.cpp)
TARGET := $(BUILD_DIR)/run_tests

.PHONY: test clean

test: $(TARGET)
	./$(TARGET)

$(TARGET): $(CORE_SRCS) $(TEST_SRCS) $(wildcard $(CORE_DIR)/*.h) TestRunner.h
	@mkdir -p $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) -I$(CORE_DIR) $(CORE_SRCS) $(TEST_SRCS) -o $@

clean:
	rm -rf $(BUILD_DIR)
